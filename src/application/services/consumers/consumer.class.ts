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
				`${String.fromCodePoint(0x1f6a7)} Failed subsscribing to topic ${this.getTopic()} with message: ${err.message}}`
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
