// Initializes the `defaultConsumer` service
import { SinkMysqlConsumerService } from './sink-mysql.class';
import { mysqlPoolDatabaseAdapater } from '../../../../database-adapters/';
import { Application, ConsumerTypes, SinkMysqlConsumerServiceOptions } from '../../../../types/types';

// import hooks from './default.hooks';

// Add this service to the service type index
declare module '../../../../types/types' {
	interface ConsumerTypes {
		SinkMysqlConsumer: SinkMysqlConsumerService;
	}
}

export default function(app: Application): void {
	// Get Kafka config
	const kafkaSettings = app.get('config.kafka');

	// Get default consumer topic
	const {
		consumer: { topic: defaultTopic, fromBeginning, sink = {} },
	} = kafkaSettings || { consumer: {} };

	const options: SinkMysqlConsumerServiceOptions = {
		id: 'sinkMysqlConsumer',
		type: 'consumer',
		kafkaSettings,
		topic: defaultTopic,
		fromBeginning: fromBeginning,
		...sink,
	};

	// Set up MySql Pool adapater which will handdle the setup and validation of its own config
	app.configure(mysqlPoolDatabaseAdapater());

	// Initialize our service with any options it requires
	app.use('sinkMysqlConsumer', new SinkMysqlConsumerService(options, app));

	// Get our initialized service so that we can register hooks
	// const service = app.service('sinkMysqlConsumer');

	// service.hooks(hooks);
}
