import Debug from 'debug';
// import { Producer } from 'kafkajs';
import { Service } from '../service.class';
import { consumer } from '../consumers';
import { producer } from '../producers';
import {
	Application,
	DefaultConsumerService,
	DefaultProducerService,
	ReplicatorServiceOptions,
	ServiceOptions,
	TopicMessages,
} from '../../../types/types';
import App from '../../application';

export class ReplicatorService extends Service {
	options: ServiceOptions;
	// replicaService: Service;
	consumer: DefaultConsumerService;
	producer: DefaultProducerService;

	/** KafkaJS producer */
	// private producer: Producer;

	/**
	 * ReplicatorService constructor
	 *
	 * @param options
	 * @param app
	 */
	constructor(options: ReplicatorServiceOptions, app: Application) {
		// Instantiate Service
		super(options, app);

		// Store
		this.options = options;

		// Set consumer with default app config
		// this.consumer = new ConsumerService(options, app);
		app.configure(consumer);
		this.consumer = app.services['consumer'];

		// Get replica cluster and producer settings
		const { replicaKafkaSettings } = options || {};

		// Create second App object for replica
		const appReplica = new App();

		// Copy config from `app` and then overwrite the kafka config
		appReplica.set('config', app.get('config'));
		appReplica.set('config.kafka', replicaKafkaSettings);

		// Set consumer with default app config
		appReplica.configure(producer);
		this.producer = appReplica.services['producer'];

		// Initialize replica cluster Service
		// this.replicaService = new Service({ ...options, kafkaSettings: replicaKafkaSettings }, appReplica);

		// Debug('metamorphosis:app:producer')(`Creating producer (${options.id}) `, producerConfig);

		// // Initialize replica cluster producer
		// this.producer = this.replicaService.getClient().producer(producerConfig);
	}

	/**
	 * Connect to both producer and consumer
	 */
	async start(): Promise<any> {
		// Connect to producer
		await this.producer.getProducer().connect();

		Debug('metamorphosis:runtime')(`Starting consumer`);
		const topic = this.consumer.getTopic();
		const groupId = this.consumer.getGroupId();

		// Subscribe consumer to topic(s)
		try {
			await this.consumer.getConsumer().connect();
			await this.consumer.getConsumer().subscribe({
				topic,
				fromBeginning: !!this.options.fromBeginning,
			});

			Debug('metamorphosis:runtime')(`${String.fromCodePoint(0x1f6a6)} Subscribing to topic ${topic} with group ${groupId}`);
		} catch (err) {
			Debug('metamorphosis:error')(
				`${String.fromCodePoint(0x1f6a7)} Failed subscribing to topic ${topic} with message: ${err.message}}`
			);

			throw err;
		}

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
		await this.consumer.getConsumer().run({
			autoCommitInterval: 5000,
			autoCommitThreshold: 100,
			eachBatch: async ({ batch, resolveOffset, commitOffsetsIfNecessary, heartbeat, isRunning, isStale }): Promise<void> => {
				if (!isRunning() || isStale()) return;

				try {
					Debug('metamorphosis:app:replicator:debug')('Consuming batch: %o', {
						topic: batch.topic,
						partition: batch.partition,
						highWatermark: batch.highWatermark,
						messages: batch.messages.length,
					});

					// Array of batched messages that will be inserted after entire batch is processed
					const batchTopicMessages: TopicMessages[] = [
						{
							topic: batch.topic,
							messages: batch.messages,
						},
					];

					await this.producer.sendBatch(batchTopicMessages);

					// Commit any resolved offsets using autoCommit thresholds
					resolveOffset(batch.lastOffset());

					// Commit any resolved offsets using autoCommit thresholds
					await commitOffsetsIfNecessary();

					await heartbeat();
				} catch (err) {
					Debug('metamorphosis:error')(`Unable to resolve message: %s %o`, err.message, err);
					throw err;
				}
			},
		});

		return this;
	}

	/**
	 * Disconnect from both producer and consumer
	 */
	async stop(): Promise<void> {
		Debug('metamorphosis:runtime')(`Replicator disconnected`);
		await this.consumer.stop();
	}
}
