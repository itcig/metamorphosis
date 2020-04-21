import { Application } from '../../../types/types';
import consumer from './default/default.service';
import sinkMysqlConsumer from './sink-mysql/sink-mysql.service';

// Export individual consumers so they can be loaded explicitly
export { consumer, sinkMysqlConsumer };

export default function(app: Application): void {
	// Import and configure all consumers here
	app.configure(consumer);
	app.configure(sinkMysqlConsumer);
}
