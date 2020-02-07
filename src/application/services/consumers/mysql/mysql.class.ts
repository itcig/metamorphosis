import Debug from 'debug';
import { ConsumerService } from '../consumer.class';
import { mysqlPoolDatabaseAdapater } from '../../../../database-adapters';
import { DatabaseMysqlPoolClient } from '../../../../database-adapters/mysql-pool/mysql-pool.class';
import { Application, MysqlConsumerServiceOptions } from '../../../../types/types';

// const debug = Debug('metamorphosis:app:consumer:mysql');
const debugErrors = Debug('metamorphosis:errors');

export class MysqlConsumerService extends ConsumerService {
	/** Service options for this consumer */
	mysqlConsumerOptions: MysqlConsumerServiceOptions;

	/** Mysql Pool Client */
	databaseClient: DatabaseMysqlPoolClient;

	/**
	 * MysqlConsumerService constructor
	 *
	 * @param options
	 * @param app
	 */
	constructor(options: MysqlConsumerServiceOptions, app: Application) {
		// Instantiate BaseConsumer
		super(options, app);

		this.mysqlConsumerOptions = options;

		app.configure(mysqlPoolDatabaseAdapater);

		this.databaseClient = app.get('mysqlAdapter');

		// if (!this.databaseClient) {
		// 	throw new Error(`Failed to create MySQL connection for consumer`);
		// }
	}

	/**
	 * Connect to both producer and consumer
	 */
	async start(): Promise<void> {
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

		await this.getConsumer().run({
			eachBatchAutoResolve: false,
			eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning, isStale }) => {
				for (const message of batch.messages) {
					if (!isRunning() || isStale()) break;

					try {
						await this.getMessageHandler().call(this as MysqlConsumerService, message);
					} catch (err) {
						debugErrors('metamorphosis.errors', JSON.stringify(err, null, 2));
					}

					resolveOffset(message.offset);
					await heartbeat();
				}
			},
		});
	}

	async query(query: string): Promise<any> {
		return this.databaseClient.query(query);
	}

	async execute(query: string, params: Array<any> | string = []): Promise<any> {
		return this.databaseClient.execute(query, params);
	}
}
