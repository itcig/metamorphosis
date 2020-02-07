// Initializes the `WebhookProducer` service
import { WebhookProducerService } from './webhook.class';
import { Application, WebhookProducerServiceOptions } from '../../../../types/types';

// import hooks from './default.hooks';

// Add this service to the service type index
declare module '../../../../types/types' {
	interface ProducerTypes {
		WebhookProducer: WebhookProducerService;
	}
}

// TODO: Allow passing in 2nd arg for options that will get merged with defaults
export default function(app: Application): void {
	// Get Kafka config
	const kafkaSettings = app.get('config.kafka');

	// Get default consumer topic
	const {
		producer: { topic: defaultTopic },
	} = kafkaSettings || { producer: { topic: {} } };

	const webhookSettings = app.get('config.webhooks');

	const { log: logger = false, port, route = '/', opts: fastifyOpts } = webhookSettings || {};

	const options: WebhookProducerServiceOptions = {
		id: 'webhookProducer',
		kafkaSettings,
		topic: defaultTopic,
		// contentType: 'application/json',
		logger,
		port,
		route,
		fastifyOpts,
	};

	// Initialize our service with any options it requires
	// TODO: Define route that can be produced to
	app.use('webhookProducer', new WebhookProducerService(options, app));

	// Get our initialized service so that we can register hooks
	// const service = app.service('webhookProducer');

	// service.hooks(hooks);
}
