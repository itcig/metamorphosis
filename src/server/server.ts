import Debug from 'debug';
import { ServerConfig } from '../types/types';

const debugError = Debug('metamorphosis:error:server:http');

export class ApplicationServer {
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

	/**
	 * Start server
	 */
	async start(): Promise<void> {
		debugError(`Cannot start base Server adapater, this object must be extended`);
		return;
	}

	/**
	 * Close server
	 */
	async stop(): Promise<void> {
		debugError(`Cannot stop base Server adapater, where are your children!?!`);
		return;
	}
}
