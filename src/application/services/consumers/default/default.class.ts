import Debug from 'debug';
import { ConsumerService } from '../consumer.class';
import { Application, DefaultConsumerServiceOptions } from '../../../../types/types';

const debugErrors = Debug('metamorphosis:errors:consumer');

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
	 * Start consumer, subscribe to our topic and listen for batches of messages.
	 * Run message callback on every message recieved and write any errors to a new Kafka topic.
	 */
	async start(): Promise<this> {
		// Run initial consumer connect and subscribe
		await super.start();

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
			// TODO: Allow setting a batch handler to allow for more advanced callbacks with partitions and topics
			eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning, isStale }) => {
				for (const message of batch.messages) {
					if (!isRunning() || isStale()) break;

					await this.getMessageHandler().call(this as DefaultConsumerService, message);

					resolveOffset(message.offset);
					await heartbeat();
				}
			},
		});

		return this;
	}
}
