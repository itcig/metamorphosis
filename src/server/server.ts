import { ServerConfig } from '../types/types';

export class Server {
	server?: any;

	/** The hostname/IP this server will listen on */
	address: string;

	/** The port this server will listen on */
	port: number;

	/** Configuration options used all server plugins */
	options: any;

	constructor(serverConfig: ServerConfig) {
		this.options = serverConfig;

		// Set hostname/IP to listen on
		this.address = serverConfig.address;

		// Set port to listen on
		this.port = serverConfig.port || 3000;
	}

	// async dbConnect(): Promise<void> {
	// 	console.error('Error: Attempting to connect to database interface instead of specific client');
	// 	return;
	// }

	get(): any {
		return this.server;
	}
}
