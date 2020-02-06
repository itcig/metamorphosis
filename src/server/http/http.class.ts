import Debug from 'debug';
import fastify from 'fastify';
import * as http from 'http';
import { Server } from '../server';
import { ServerConfig, ServerInterface } from '../../types/types';

const debug = Debug('metamorphosis:server:http');
const debugError = Debug('metamorphosis:error:server:http');

export class HttpServer extends Server implements ServerInterface {
	constructor(serverConfig: ServerConfig) {
		// Instantiate Server
		super(serverConfig);

		// Set up our Fastify HTTP server
		// Our HTTP server to listen for requests. We pass the relevant typings for our http version used.
		// By passing types we get correctly typed access to the underlying http objects in routes.
		// If using http2 we'd pass <http2.Http2Server, http2.Http2ServerRequest, http2.Http2ServerResponse>
		// For https pass http2.Http2SecureServer or http.SecureServer instead of Server.
		const server: fastify.FastifyInstance<http.Server, http.IncomingMessage, http.ServerResponse> = fastify({
			...(serverConfig.logger && { logger: serverConfig.logger }),
		});

		// Set server object on parent
		this.server = server;
	}

	/**
	 * Connect to producer and start http server
	 */
	async start(): Promise<void> {
		try {
			await this.server.listen(this.port, this.address);
			debug(`Metamorphosis server listening on %s:%d`, this.address, this.port);
		} catch (err) {
			debugError(err);
			process.exit(1);
		}
	}

	setRoute(route: string, httpMethod: fastify.HTTPMethod = 'GET'): this {
		debug(`Setting route for '${this.options.route}'`);

		const opts: fastify.RouteOptions = this.options.fastifyOpts || {};

		const handler = async (request, reply): Promise<any> => {
			debug(reply.res); // this is the http.ServerResponse with correct typings!

			debugError(`No callback provided for route '${route}'`);
			// try {
			// 	const recordMeta = await this.send({
			// 		value: request.body,
			// 	});

			// 	// Send back a success reponse
			// 	reply
			// 		.type(contentType)
			// 		.code(200)
			// 		.send(JSON.stringify(recordMeta, null, 2));
			// } catch (err) {
			// 	debugError(err);
			// 	// Send back a success reponse
			// 	return reply.send(500);
			// }
		};

		const routeOptions: fastify.RouteOptions = {
			method: httpMethod,
			url: route,
			handler,
			...opts,
		};

		// Declare our route
		this.server.route(routeOptions);

		return this;
	}

	/**
	 * Close connection
	 */
	async stop(): Promise<void> {
		try {
			await this.server.close();
			debug('Goodbye!');
		} catch (err) {
			debugError('Error while stopping server', err);
		}
	}
}
