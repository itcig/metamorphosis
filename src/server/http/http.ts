import Debug from 'debug';
import { HttpServer } from './http.class';
import { Application, ServerConfig } from '../../types/types';

// const debug = Debug('metamorphosis:server:http');
const debugError = Debug('metamorphosis:error:server:http');

export default function(app: Application): void {
	const serverConfig = app.get('server');

	// Ensure the minimum values are set to create MySQL Pool
	const hasRequriedProps = ['database'].reduce((i, j) => i && j in serverConfig, true);

	if (!hasRequriedProps) {
		debugError(`Missing required properties to create HTTP server`, serverConfig);
		return;
	}

	// Set defaults and merge with config
	const config: ServerConfig = {
		address: '0.0.0.0',
		port: 3000,
		...serverConfig,
	};

	app.set('server', new HttpServer(config));
}
