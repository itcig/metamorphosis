// Initializes the `defaultConsumer` service
import { DefaultConsumerService } from './default.class';
import { Application, DefaultConsumerServiceOptions, ConsumerTypes } from '../../../../types/types';

// import hooks from './default.hooks';

// Add this service to the service type index
declare module '../../../../types/types' {
	interface ConsumerTypes {
		Consumer: DefaultConsumerService;
	}
}

export default function(app: Application): void {
	// Get Kafka config
	const kafkaSettings = app.get('config.kafka');

	// console.log('setup default consumer', kafkaSettings);

	// Get default consumer topic
	const {
		consumer: { topic: defaultTopic, fromBeginning },
	} = kafkaSettings || { consumer: {} };

	const options: DefaultConsumerServiceOptions = {
		id: 'consumer',
		type: 'consumer',
		kafkaSettings,
		topic: defaultTopic,
		fromBeginning: fromBeginning,
	};

	// Initialize our service with any options it requires
	// TODO: Define route that can be produced to
	app.use('consumer', new DefaultConsumerService(options, app));

	// Get our initialized service so that we can register hooks
	// const service = app.service('defaultConsumer');

	// service.hooks(hooks);
}
