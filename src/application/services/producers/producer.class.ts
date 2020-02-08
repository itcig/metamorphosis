import Debug from 'debug';
import { CompressionTypes, Message, Producer, ProducerRecord, RecordMetadata, ProducerBatch, TopicMessages } from 'kafkajs';
import { Service } from '../service.class';
import { Application, ProducerServiceOptions } from '../../../types/types';

const debug = Debug('metamorphosis:app:producer');
const debugError = Debug('metamorphosis:error');

export class ProducerService extends Service {
	/** Service options shared by all producers */
	options: ProducerServiceOptions;

	/** KafkaJS producer */
	private producer: Producer;

	/**
	 * ProducerService constructor
	 *
	 * @param options
	 * @param app
	 */
	constructor(options: ProducerServiceOptions, app: Application) {
		super(options, app);

		this.options = options;

		// Get producer config
		const {
			kafkaSettings: { producer: producerConfig },
		} = options || { producer: {} };

		debug(`Creating producer ${options.id} `, producerConfig);

		// Initialize producer
		this.producer = this.getClient().producer(producerConfig);
	}

	/**
	 * Disconnect from both produce
	 */
	async stop(): Promise<void> {
		await this.producer.disconnect();
	}

	/**
	 * Send messages to producer topic. Messages are always sent as an array so this wrapper
	 * is just a shortcut for sending an individual message
	 */
	async send(message: Message): Promise<RecordMetadata[]> {
		// Build message array to send to kafkajs
		const messages = [message];

		// Send single
		return await this.sendMessages(messages);
	}

	/**
	 * Send messages to producer topic
	 */
	async sendMessages(messages: Message[]): Promise<RecordMetadata[]> {
		const topic = this.getTopic();
		debug(`Producing to topic (${topic})`, messages);

		const producerRecord: ProducerRecord = {
			topic,
			messages,
			acks: this.options.acks || -1, // Default is -1 "all leaders must acknowledge"
			timeout: this.options.timeout || 30000,
			compression: CompressionTypes.None,
		};

		try {
			const response = await this.getProducer().send(producerRecord);

			debug('Done producing');

			return response;
		} catch (err) {
			debugError(`Error producing message: %o`, err);
			throw err;
		}
	}

	/**
	 * Send messages to multiple topics
	 *
	 * @param topicMessages Array of TopicMessages which contain a `topic` key and `messages` key as the same array of messages that would be passed to `sendMessages()`
	 */
	async sendBatch(topicMessages: TopicMessages[]): Promise<RecordMetadata[]> {
		const producerBatch: ProducerBatch = {
			topicMessages,
			acks: this.options.acks || -1, // Default is -1 "all leaders must acknowledge"
			timeout: this.options.timeout || 30000,
			compression: CompressionTypes.None,
		};

		try {
			const response = await this.getProducer().sendBatch(producerBatch);

			debug('Done producing');

			return response;
		} catch (err) {
			debugError(`Error producing message: %o`, err);
			throw err;
		}
	}

	/**
	 * Get the producer topic
	 */
	getTopic = (): string => this.options.topic;

	/**
	 * Get the kafkajs producer object
	 */
	getProducer = (): Producer => this.producer;
}
