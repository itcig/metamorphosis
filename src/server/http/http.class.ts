import Debug from 'debug';
import fastify, { FastifyInstance, RouteOptions, HTTPMethod } from 'fastify';
import * as http from 'http';
import { ApplicationServer } from '../server';
import { ServerConfig, ServerInterface, ProducerService, GenericOptions } from '../../types/types';

const debug = Debug('metamorphosis:server:http');
const debugError = Debug('metamorphosis:error:server:http');

export class HttpServer extends ApplicationServer implements ServerInterface {
	server: FastifyInstance<http.Server, http.IncomingMessage, http.ServerResponse>;

	routes: Array<string | Partial<RouteOptions>>[] = [];

	constructor(serverConfig: ServerConfig) {
		// Instantiate Server
		super(serverConfig);

		// Set up our Fastify HTTP server
		// Our HTTP server to listen for requests. We pass the relevant typings for our http version used.
		// By passing types we get correctly typed access to the underlying http objects in routes.
		// If using http2 we'd pass <http2.Http2Server, http2.Http2ServerRequest, http2.Http2ServerResponse>
		// For https pass http2.Http2SecureServer or http.SecureServer instead of Server.
		const server: FastifyInstance<http.Server, http.IncomingMessage, http.ServerResponse> = fastify({
			...(serverConfig.logger && { logger: serverConfig.logger }),
			// logger: {
			// 	level: 'debug',
			// },
		});

		// Set server object on parent
		this.server = server;
	}

	/**
	 * Set a new route
	 */
	// setRoute(route: string, httpMethod: HTTPMethod | HTTPMethod[] = 'GET', handler?: RequestHandler): this {
	setRoute(url: string, routeOptions: Partial<RouteOptions>): this {
		if (url.length < 1) {
			throw new Error(`Route path cannot be empty`);
		}

		debug(`Setting route for '${url}'`);

		// Lookup default fastify options from config
		const opts: RouteOptions = this.options.fastifyOpts || {};

		// Add all routes to array for referencing outside this class
		this.routes = [...this.routes, [url, routeOptions]];

		// If empty, then add default handler to alert of error
		if (!routeOptions.handler) {
			routeOptions.handler = (): void => debugError(`No callback provided for route '${url}'`);
		}

		// Set default HTTP method if not passed in any way
		if (!routeOptions.method && !opts.method) {
			routeOptions.method = 'GET';
		}

		// Merge basic route params with any other Fastify options or config
		const mergedRouteOptions: RouteOptions = {
			...opts,
			...routeOptions,
			url,
		};

		// Install our route
		this.server.route(mergedRouteOptions);

		return this;
	}

	setProducerRoute(
		url: string,
		routeOptions: Partial<RouteOptions>,
		producer: ProducerService,
		responseOptions: GenericOptions = {}
	): this {
		routeOptions.handler = async (request, reply): Promise<void> => {
			try {
				const recordMeta = await producer.send({
					// value: Buffer.from(
					// 	JSON.stringify(request.body),
					// 	'utf8'
					// ),
					value: JSON.stringify(request.body),
				});

				// Set content-type header if passed
				if (responseOptions.contentType) {
					reply.type(responseOptions.contentType);
				}

				debug(`Record produced`, JSON.stringify(recordMeta));

				// TODO: What should be sent back? How should this be set in arguments?
				// Send back a success reponse
				reply.code(200).send(true);
			} catch (err) {
				debug(err);
				reply.send(500);
			}
		};

		// Install route
		this.setRoute(url, routeOptions);

		return this;
	}

	/**
	 * Get all registered routes
	 */
	getRoutes(): any[] {
		return this.routes;
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
