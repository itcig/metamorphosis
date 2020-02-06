import Debug from 'debug';
import { ConsumerService } from '../consumer.class';
import { Application, DefaultConsumerServiceOptions } from '../../../../types/types';

// const debug = Debug('metamorphosis:app:consumer:mysql');
const debugErrors = Debug('metamorphosis:errors');

export class DefaultConsumerService extends ConsumerService {
	/** Service options for this consumer */
	defaultConsumerOptions: DefaultConsumerServiceOptions;

	/**
	 * DefaultConsumerService constructor
	 *
	 * @param options
	 * @param app
	 */
	constructor(options: DefaultConsumerServiceOptions, app: Application) {
		// Instantiate BaseConsumer
		super(options, app);

		this.defaultConsumerOptions = options;
	}

	/**
	 * Connect to both producer and consumer
	 */
	async start(): Promise<void> {
		// await Promise.all([this.startProducer(), this.startConsumer()]);
		await this.startConsumer();
	}

	/**
	 * Start consumer, subscribe to our topic and listen for batches of messages.
	 * Run message callback on every message recieved and write any errors to a new Kafka topic.
	 */
	async startConsumer(): Promise<void> {
		const topic = this.getTopic();

		await this.getConsumer().connect();
		await this.getConsumer().subscribe({
			topic,
		});

		console.log(`\n${String.fromCodePoint(0x1f6a6)} SUBSCRIBING TO TOPIC ${topic} WITH GROUP ${this.getGroupId()}:\n`);

		/**
		 * Batch message
		 *
		 * {
		 *		topic: batch.topic,
		 *		partition: batch.partition,
		 *		highWatermark: batch.highWatermark,
		 *		message: {
		 *			offset: message.offset,
		 *			key: message.key
		 *				? message.key.toString()
		 *				: null,
		 *			value: message.value
		 *				? message.value.toString()
		 *				: null,
		 *			headers: message.headers
		 *				? message.headers.toString()
		 *				: null,
		 *		},
		 *	}
		 */
		await this.getConsumer().run({
			eachBatchAutoResolve: false,
			eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning, isStale }) => {
				// const errorMessages: Array<Message> = [];

				for (const message of batch.messages) {
					if (!isRunning() || isStale()) break;

					try {
						await this.getMessageHandler().call(this as DefaultConsumerService, message);
					} catch (err) {
						debugErrors('metamorphosis.errors', JSON.stringify(err, null, 2));
						// console.error(err);
						// TODO: Log error messages using an ErrorProducer service
						// errorMessages.push({
						// 	key: Buffer.from(batch.topic, 'utf8'),
						// 	value: Buffer.from(
						// 		JSON.stringify({
						// 			timestamp: message.timestamp,
						// 			topic: batch.topic,
						// 			originalMessage: message,
						// 			error: {
						// 				code: err.code,
						// 				message: err.message,
						// 				trace: err.stack,
						// 			},
						// 		}),
						// 		'utf8'
						// 	),
						// });
					}

					resolveOffset(message.offset);
					await heartbeat();
				}

				// Send error messages to error topic
				// if (this.getConfig('topics.error')) {
				// 	await this.getProducer().send({
				// 		topic: this.getConfig('topics.error'),
				// 		messages: errorMessages,
				// 	});
				// }
			},
		});
	}
}
