import { Application } from '../../../types/types';
import consumer from './default/default.service';
import sinkMysqlConsumer from './sink-mysql/sink-mysql.service';
import debeziumMysqlConsumer from './debezium-mysql/debezium-mysql.service';

// Export individual consumers so they can be loaded explicitly
export { consumer, sinkMysqlConsumer, debeziumMysqlConsumer };

export default function(app: Application): void {
	// Import and configure all consumers here
	app.configure(consumer);
	app.configure(sinkMysqlConsumer);
	app.configure(debeziumMysqlConsumer);
}
