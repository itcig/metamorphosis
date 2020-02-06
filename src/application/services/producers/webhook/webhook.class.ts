import fastify from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import Debug from 'debug';
import { ProducerService } from '../producer.class';
import { Application, WebhookProducerServiceOptions } from '../../../../types/types';

const debug = Debug('metamorphosis:app:producer:webhooks');
const debugError = Debug('metamorphosis:error');

// TODO: Create a SecureWebhook producer or allow passing in a flag to use https libraries.
// not a large concern right now because in production, this application should be run as a container behind an
// ingress that is managing SSL

export class WebhookProducerService extends ProducerService {
	/** Service options for this consumer */
	webhookProducerOptions: WebhookProducerServiceOptions;

	// Our HTTP server to listen for requests. We pass the relevant typings for our http version used.
	// By passing types we get correctly typed access to the underlying http objects in routes.
	// If using http2 we'd pass <http2.Http2Server, http2.Http2ServerRequest, http2.Http2ServerResponse>
	// For https pass http2.Http2SecureServer or http.SecureServer instead of Server.
	server: fastify.FastifyInstance<Server, IncomingMessage, ServerResponse>;

	port: number;

	/**
	 * WebhookProducerService constructor
	 *
	 * @param options
	 * @param app
	 */
	constructor(options: WebhookProducerServiceOptions, app: Application) {
		// Instantiate BaseConsumer
		super(options, app);

		this.webhookProducerOptions = options;

		// app.configure(MysqlPoolDatabaseAdapater);

		this.server = fastify({
			logger: options.logger,
		});

		// Set port to listen on
		this.port = options.port;

		// Store server so we can hook into for error handling and connection management elsewhere
		app.set('server', this.server);
	}

	setRoute(): this {
		debug(`Setting route for '${this.options.route}' to produce to topic '${this.getTopic()}'`);

		const opts: fastify.RouteShorthandOptions = this.webhookProducerOptions.fastifyOpts || {};

		const contentType = this.webhookProducerOptions.contentType || 'application/text';

		// Declare our route
		this.server.post(this.options.route, opts, async (request, reply) => {
			debug(reply.res); // this is the http.ServerResponse with correct typings!

			try {
				const recordMeta = await this.send({
					value: request.body,
				});

				// Send back a success reponse
				reply
					.type(contentType)
					.code(200)
					.send(JSON.stringify(recordMeta, null, 2));
			} catch (err) {
				debugError(err);
				// Send back a success reponse
				return reply.send(500);
			}
		});

		return this;
	}

	/**
	 * Connect to producer and start http server
	 */
	async start(): Promise<void> {
		console.log('starting');
		await this.startProducer();

		// Set up route using service config
		this.setRoute();

		// Listen on all IPs
		const address = '0.0.0.0';

		// Get the Id of this producer for logging
		const producerId = this.id;

		try {
			await this.server.listen(this.port, address);
			debug(`Webhook producer '%s' listening on %s:%d`, producerId, address, this.port);
		} catch (err) {
			debugError(err);
			process.exit(1);
		}
	}

	/**
	 * Start the producer
	 */
	async startProducer(): Promise<void> {
		await this.getProducer().connect();
	}
}
