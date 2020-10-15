import App from './application';
import { Application } from '../types/types';

// Export barrel objects as well as individual service so we can import all or specific services in our application
export { default as services } from './services';
export { default as consumers, consumer, sinkMysqlConsumer, debeziumMysqlConsumer } from './services/consumers';
export { default as producers, producer } from './services/producers';
export { replicator } from './services/replicator';

// interface Metamophosis {
// 	// <T = any>(): Application<T>;
// 	version: string;
// 	default: Metamophosis;
// }

export default function createApplication(): Application {
	const app = new App();
	app.init();

	return app;
}
