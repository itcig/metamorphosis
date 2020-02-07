import { HttpServer } from './http.class';
import { Application, GenericOptions, InitFunction, ServerConfig } from '../../types/types';

export default function init(opts?: GenericOptions): InitFunction {
	return (app?: Application): void => {
		// Do nothing if Application is not set
		if (!app) {
			return;
		}

		const serverConfig = app.get('config.server');

		// Set defaults and merge with config
		const config: ServerConfig = {
			address: '0.0.0.0',
			port: 3000,
			...serverConfig,
			...opts,
		};

		app.set('server', new HttpServer(config));
	};
}
