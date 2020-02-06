import { ProducerService } from '../producer.class';
import { Application, DefaultProducerServiceOptions } from '../../../../types/types';

export class DefaultProducerService extends ProducerService {
	/**
	 * DefaultProducerService constructor
	 *
	 * @param options
	 * @param app
	 */
	constructor(options: DefaultProducerServiceOptions, app: Application) {
		// Instantiate BaseConsumer
		super(options, app);
	}

	/**
	 * Connect to both producer and consumer
	 */
	async start(): Promise<void> {
		await this.startProducer();
	}

	/**
	 * Start just producer
	 */
	async startProducer(): Promise<void> {
		await this.getProducer().connect();
	}
}
