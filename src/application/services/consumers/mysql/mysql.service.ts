// Initializes the `mysqlConsumer` service
import { MysqlConsumerService } from './mysql.class';
import { Application, MysqlConsumerServiceOptions } from '../../../../types/types';

// import hooks from './mysql.hooks';

// Add this service to the service type index
declare module '../../../../types/types' {
	interface ConsumerTypes {
		MysqlConsumer: MysqlConsumerService;
	}
}

export default function(app: Application): void {
	// Get Kafka settings
	const kafkaSettings = app.get('kafka');

	// Get default consumer topic
	const {
		consumer: { topic: defaultTopic },
	} = kafkaSettings || { consumer: { topic: {} } };

	const options: MysqlConsumerServiceOptions = {
		id: 'mysqlConsumer',
		kafkaSettings,
		topic: defaultTopic,
	};

	// Initialize our service with any options it requires
	const mysqlConsumerService = new MysqlConsumerService(options, app);

	// If we do not meet the minimum configuration then do not append service to application
	if (mysqlConsumerService.databaseClient) {
		app.use('mysqlConsumer', mysqlConsumerService);
	}

	// Get our initialized service so that we can register hooks
	// const service = app.service('mysqlConsumer');

	// service.hooks(hooks);
}
