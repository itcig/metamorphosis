import Debug from 'debug';
import { ConsumerService } from '../consumer.class';
import Differify from '@netilon/differify';
import { Application, DebeziumMysqlConsumerServiceOptions } from '../../../../types/types';
import KafkaSchemaRegistry from '../../../registry';

const debugError = Debug('metamorphosis:error');

export class DebeziumMysqlConsumerService extends ConsumerService {
	/** Service options for this consumer */
	debeziumMysqlConsumerOptions: DebeziumMysqlConsumerServiceOptions;

	/** MySql client */
	database;

	/** Schema Registry client */
	registry?: KafkaSchemaRegistry;

	/**
	 * DefaultConsumerService constructor
	 *
	 * @param options
	 * @param app
	 */
	constructor(options: DebeziumMysqlConsumerServiceOptions, app: Application) {
		// Instantiate BaseConsumer
		super(options, app);

		this.debeziumMysqlConsumerOptions = options;

		this.database = app.get('database');

		this.registry = app.get('registry');
	}

	/**
	 * Start consumer, subscribe to our topic and listen for batches of messages.
	 * Run message callback on every message recieved and write any errors to a new Kafka topic.
	 */
	async start(): Promise<this | undefined> {
		// Do not continue without a record handler callback
		if (!this.options.recordHandler) {
			return;
		}

		// Connect to  MySql
		await this.database.connect();

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
			autoCommitInterval: 5000,
			autoCommitThreshold: 100,
			eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning, isStale }): Promise<void> => {
				Debug('metamorphosis:app:consumer:debezium-mysql:debug')(`Consuming batch of ${batch.messages.length} messages`);

				for (const message of batch.messages) {
					if (!isRunning() || isStale()) break;

					try {
						// Extract message value from Kafka message
						const { value: messageValue } = message || {};

						// Skip if no message `value`
						if (!messageValue) {
							continue;
						}

						// Kafka message value should be Avro encoded so decode, otherwise try to read as JSON-encoded Buffer
						const parsedValue = this.registry ? await this.registry.decode(messageValue) : JSON.parse(messageValue.toString());

						// eslint-disable-next-line @typescript-eslint/camelcase
						const { name, before, after, source, op, ts_ms: tsMs } = parsedValue || {};

						// Compare before and after data
						// These properties will be null if creating or deleting so change to empty object or comparison will not work correctly
						const differify = new Differify();
						const comparison: { [key: string]: any } = differify.compare(before || {}, after || {});

						const fields: { [key: string]: any } = comparison._ || {};

						const changeData: { [key: string]: any } = Object.keys(fields)
							.filter((key: string) => fields[key].changes)
							.reduce((obj, key) => {
								obj[key] = fields[key].current;
								return obj;
							}, {});

						// Run record handler callback
						await this.options.recordHandler(this.database, name, source, op, before, after, changeData, tsMs);

						Debug('metamorphosis:app:consumer:debezium-mysql:verbose')('Resolving offset: %s', message.offset);

						resolveOffset(message.offset);
						await heartbeat();
					} catch (err) {
						debugError(`Unable to parse message: %s %o`, err.message, err);
						throw err;
					}
				}
			},
		});

		return this;
	}
}
