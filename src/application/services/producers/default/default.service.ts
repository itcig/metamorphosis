// Initializes the `defaultProducer` service
import { DefaultProducerService } from './default.class';
import { Application, DefaultProducerServiceOptions } from '../../../../types/types';

// import hooks from './default.hooks';

// Add this service to the service type index
declare module '../../../../types/types' {
	interface ProducerTypes {
		Producer: DefaultProducerService;
	}
}

// TODO: Allow passing in 2nd arg for options that will get merged with defaults
export default function(app: Application): void {
	// Get Kafka config
	const kafkaSettings = app.get('config.kafka');

	// Get default consumer topic
	const { producer: { topic: defaultTopic = null, compression = null } = {} } = kafkaSettings || { producer: {} };

	const options: DefaultProducerServiceOptions = {
		id: 'producer',
		type: 'producer',
		kafkaSettings,
		topic: defaultTopic,
		compression,
	};

	// Initialize our service with any options it requires
	// TODO: Define route that can be produced to
	app.use('producer', new DefaultProducerService(options, app));

	// Get our initialized service so that we can register hooks
	// const service = app.service('defaultProducer');

	// service.hooks(hooks);
}
