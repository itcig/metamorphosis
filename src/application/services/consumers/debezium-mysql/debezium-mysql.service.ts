// Initializes the `defaultConsumer` service
import { DebeziumMysqlConsumerService } from './debezium-mysql.class';
import { Application, ConsumerTypes, DebeziumMysqlConsumerServiceOptions } from '../../../../types/types';

// import hooks from './default.hooks';

// Add this service to the service type index
declare module '../../../../types/types' {
	interface ConsumerTypes {
		DebeziumMysqlConsumer: DebeziumMysqlConsumerService;
	}
}

export default function(app: Application): void {
	// Get Kafka config
	const kafkaSettings = app.get('config.kafka');

	// Get default consumer topic
	const {
		consumer: { topic: defaultTopic, fromBeginning, recordHandler },
	} = kafkaSettings || { consumer: {} };

	const options: DebeziumMysqlConsumerServiceOptions = {
		id: 'debeziumMysqlConsumer',
		type: 'consumer',
		kafkaSettings,
		topic: defaultTopic,
		fromBeginning: fromBeginning,
		recordHandler,
	};

	// Initialize our service with any options it requires
	app.use('debeziumMysqlConsumer', new DebeziumMysqlConsumerService(options, app));

	// Get our initialized service so that we can register hooks
	// const service = app.service('debeziumMysqlConsumer');

	// service.hooks(hooks);
}
