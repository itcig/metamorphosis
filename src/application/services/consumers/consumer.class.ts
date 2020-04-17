import Debug from 'debug';
import { Consumer } from 'kafkajs';
import { Service } from '../service.class';
import { Application, ConsumerBatchCallback, ConsumerMessageCallback, ConsumerServiceOptions } from '../../../types/types';

const debug = Debug('metamorphosis:app:consumer');

export class ConsumerService extends Service {
	/** Service options shared by all consumers */
	options: ConsumerServiceOptions;

	/** KafkaJS consumer */
	private consumer: Consumer;

	/** Track how many times consumer has been restarted */
	private restarts = 0;

	/**
	 * ConsumerService constructor
	 * @param options
	 * @param app
	 */
	constructor(options: ConsumerServiceOptions, app: Application) {
		super(options, app);

		this.options = options;

		// Set warning if no default message handler is set
		if (!this.options.messageHandler) {
			this.options.messageHandler = async (): Promise<void> => console.warn('WARNING: You should set up a message callback');
		}

		// Get consumer config
		const {
			kafkaSettings: { consumer: consumerConfig },
		} = options || { consumer: {} };

		debug(`Creating consumer ${options.id} `, consumerConfig);

		// Initialize consumer
		this.consumer = this.getClient().consumer(consumerConfig);

		// Set consumer crash listener. Destroy it by calling `this.removeCrashListener()`
		this.consumer.on('consumer.crash', e => this.crashHandler(e));
	}

	async crashHandler(event: any): Promise<void> {
		const {
			payload: { error },
		} = event || { payload: {} };

		if (error) {
			Debug('metamorphosis:error')(`Consumer crash:`, error);
			// Wait 3 seconds and try to reconnect until maxRetries is reached
			if (error.name !== 'KafkaJSNumberOfRetriesExceeded' && error.retriable !== true) {
				// Get consumer restart config
				const { maxRestarts = 3, restartInterval = 1000 } = this.options || {};

				// Restart consumer continually until problem is solved
				setTimeout(async () => {
					this.restarts++;
					await this.restart();
				}, restartInterval);

				// NOTE: Not currently used since we'll just restart until the issue is fixed. Presumably some other monitoring
				// would detect the application is not consuming or constantly reconnecting
				// // If we have not reached the maxRetries then try to restart consumer
				// if (this.restarts < maxRestarts) {
				// 	setTimeout(async () => {
				// 		this.restarts++;
				// 		await this.restart();
				// 	}, restartInterval);
				// } else {
				// 	Debug('metamorphosis:error')(`Max consumer restarts (${maxRestarts}) reached`);
				// // This will cause an unhandled promise exception
				// 	throw new Error(`Max consumer restarts (${maxRestarts}) reached`);
				// }
			}
		}
	}

	/**
	 * Connect to consumer with configured topic
	 */
	async start(): Promise<any> {
		debug(`Starting consumer`);
		const topic = this.getTopic();

		try {
			await this.getConsumer().connect();
			await this.getConsumer().subscribe({
				topic,
				fromBeginning: !!this.options.fromBeginning,
			});

			Debug('metamorphosis:runtime')(
				`${String.fromCodePoint(0x1f6a6)} Subscribing to topic ${this.getTopic()} with group ${this.getGroupId()}`
			);
		} catch (err) {
			Debug('metamorphosis:error')(
				`${String.fromCodePoint(0x1f6a7)} Failed subscribing to topic ${this.getTopic()} with message: ${err.message}}`
			);

			throw err;
		}
	}

	/**
	 * Disconnect from both producer and consumer
	 */
	async stop(): Promise<void> {
		debug(`Consumer ${this.getGroupId()} (${this.getTopic()}) disconnected`);
		await this.consumer.disconnect();
	}

	/**
	 * Restart conssumer
	 */
	async restart(): Promise<any> {
		debug(`Consumer ${this.getGroupId()} (${this.getTopic()}) restarting`);
		await this.stop();
		await this.start();
	}

	// setMessageHandler = (callback: ConsumerMessageCallback): this => {
	// 	this.options.messageHandler = callback;
	// 	return this;
	// };

	// setMessageHandler = (callback: (message: Message) => Promise<void>): void => {
	// 	this.options.messageHandler = callback;
	// };

	getConsumer = (): Consumer => this.consumer;

	getGroupId = (): string => this.getConfig('kafkaSettings.consumer.groupId');

	getTopic = (): string => this.options.topic;

	getMessageHandler = (): ConsumerMessageCallback => this.options.messageHandler || (async (): Promise<void> => undefined);

	getBatchHandler = (): ConsumerBatchCallback | undefined => this.options.batchHandler;
}
