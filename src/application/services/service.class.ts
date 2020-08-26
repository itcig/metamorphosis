/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Debug from 'debug';
import { CompressionCodecs, CompressionTypes, Kafka } from 'kafkajs';
import SnappyCodec from 'kafkajs-snappy';
import KafkaSchemaRegistry from '../registry';
import { get } from 'lodash';
import deepmerge from 'deepmerge';
import { Application, Id, ServiceMethods, ServiceOptions } from '../../types/types';

const debug = Debug('metamorphosis:app:service');

export class Service<T = any> implements ServiceMethods<T> {
	options: ServiceOptions;

	client: Kafka;

	registry?: KafkaSchemaRegistry;

	/**
	 * Service constructor
	 *
	 * @param options
	 * @param app
	 */
	constructor(options: ServiceOptions, app: Application) {
		this.options = options;

		// Check if app has already set client
		const appClient = app.get('client');

		if (!appClient) {
			const { kafkaSettings } = options;
			const { config, registry } = kafkaSettings || {};
			const { brokers } = config || {};

			// Ensure brokers list is an array
			if (brokers && !Array.isArray(brokers)) {
				const brokerString: string = brokers!.toString();
				config.brokers = brokerString.split(',');
			}

			// Add support for Snappy compression
			CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec;

			debug(`Setting Kafka client`, config);

			// Create new Kafka client
			this.client = new Kafka(config);

			// Set client for later use
			app.set('client', this.client);

			// Load schema registry if URI is set
			if (registry) {
				this.registry = new KafkaSchemaRegistry(registry);

				// Set registry for later use
				app.set('registry', this.registry);

				debug(`Setting Kafka schema registry`, registry.host);
			}
		} else {
			// Use existing client attached to app to avoid duplicating connections
			this.client = appClient;
		}
	}

	get(): Service<T> {
		return this;
	}

	get id(): Id {
		return this.options.id;
	}

	get type(): string {
		return this.options.type || '';
	}

	get events(): string[] {
		return this.options.events || [];
	}

	getClient = (): Kafka => this.client;

	getConfig = (key?: string): any => (this.options && key ? get(this.options, key) : this.options);

	setConfig = (overrideOptions: Partial<ServiceOptions>): this => {
		this.options = deepmerge(this.options, overrideOptions);
		return this;
	};
}
