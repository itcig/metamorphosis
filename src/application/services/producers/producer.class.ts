import Debug from 'debug';
import { Message, Producer } from 'kafkajs';
import { Service } from '../service.class';
import { Application, ProducerServiceOptions } from '../../../types/types';

const debug = Debug('metamorphosis:app:producer');

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
	async send(message: Message): Promise<void> {
		// Build message array to send to kafkajs
		const messages = [message];

		// Send single
		await this.sendMessages(messages);
	}

	/**
	 * Send messages to producer topic
	 */
	async sendMessages(messages: Message[]): Promise<void> {
		const topic = this.getTopic();
		debug(`Producing to topic (${topic})`, messages);

		await this.getProducer().send({
			topic,
			messages,
		});

		debug('Done producing');
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
