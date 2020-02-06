// Initializes the `defaultConsumer` service
import { DefaultConsumerService } from './default.class';
import { Application, DefaultConsumerServiceOptions } from '../../../../types/types';

// import hooks from './default.hooks';

// Add this service to the service type index
declare module '../../../../types/types' {
	interface ConsumerTypes {
		DefaultConsumer: DefaultConsumerService;
	}
}

export default function(app: Application): void {
	// Get Kafka config
	const kafkaSettings = app.get('kafka');

	// console.log('setup default consumer', kafkaSettings);

	// Get default consumer topic
	const {
		consumer: { topic: defaultTopic },
	} = kafkaSettings || { consumer: { topic: {} } };

	const options: DefaultConsumerServiceOptions = {
		id: 'defaultConsumer',
		kafkaSettings,
		topic: defaultTopic,
	};

	// Initialize our service with any options it requires
	// TODO: Define route that can be produced to
	app.use('defaultConsumer', new DefaultConsumerService(options, app));

	// Get our initialized service so that we can register hooks
	// const service = app.service('defaultConsumer');

	// service.hooks(hooks);
}
