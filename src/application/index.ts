import App from './application';
import { Application } from '../types/types';

// Export barrel objects as well as individual service so we can import all or specific services in our application
export { default as services } from './services';
export { default as consumers, defaultConsumer, mysqlConsumer } from './services/consumers';
export { default as producers, defaultProducer, webhookProducer } from './services/producers';

// interface Metamophosis {
// 	// <T = any>(): Application<T>;
// 	version: string;
// 	default: Metamophosis;
// }

export default function createApplication(): Application {
	const app = new App();
	// app.configure(services);
	app.init();

	return app;
}
