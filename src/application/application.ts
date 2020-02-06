import Debug from 'debug';
import deepmerge from 'deepmerge';
import { get, set } from 'lodash';

// import events from './events';
// import hooks from './hooks';

import { Application, ServiceMethods, ServiceTypes, SetupMethod } from '../types/types';

const debug = Debug('metamorphosis:app');
const { version } = require('../../package.json');

export default class App implements Application {
	version: string = version;
	methods: string[] = ['get'];
	mixins: any[] = [];
	services: {} = {};
	providers: any[] = [];
	_isSetup = false;
	settings: {} = {};
	// defaultService?: DefaultService = new DefaultService({});

	init(): void {
		debug('Metamorphosis Initialized');
		// this.configure(hooks());
		// this.configure(events());
	}

	get(name: string): any {
		// return this.settings[name];
		return get(this.settings, name);
	}

	set(name: string, value: any): this {
		set(this.settings, name, value);
		// this.settings[name] = value;
		return this;
	}

	merge(name: string, value: any): this {
		const currVal = this.get(name);
		const newVal = deepmerge(currVal, value);
		set(this.settings, name, newVal);
		return this;
	}

	disable(name: string): this {
		this.settings[name] = false;
		return this;
	}

	disabled(name: string): boolean {
		return !this.settings[name];
	}

	enable(name: string): this {
		this.settings[name] = true;
		return this;
	}

	enabled(name: string): boolean {
		return !!this.settings[name];
	}

	getServiceConfigs(): any {
		return Object.keys(this.services)
			.map(service => this.services[service].getConfig())
			.reduce((obj, item) => {
				obj[item.id] = item;
				return obj;
			}, {});
	}

	debug(namespace: string, formatter: any, ...args: any[]): void {
		Debug(namespace)(formatter, ...args);
	}

	configure(callback: (this: this, app: this) => void): this {
		callback.call(this, this);

		return this;
	}

	service(serviceName: string): keyof ServiceTypes {
		// extends never ? any : never {

		// if (typeof service !== 'undefined') {
		// 	throw new Error(
		// 		'Registering a new service with `app.service(path, service)` is no longer supported. Use `app.use(path, service)` instead.'
		// 	);
		// }

		const current = this.services[serviceName];

		// Default service
		// if (typeof current === 'undefined' && typeof this.defaultService === 'function') {
		// 	return this.use(serviceName, this.defaultService).service(serviceName);
		// }

		return current;
	}

	use(serviceName: string, service: Partial<ServiceMethods<any> & SetupMethod> | Application, options?: any): this {
		// use(path, service, options = {}) {

		// const isService = this.methods.concat('setup').some(name => typeof service[name] === 'function');

		// if (!isService) {
		// 	throw new Error(`Invalid service object passed \`${serviceName}\``);
		// }

		// If we ran setup already, set this service up explicitly
		if (this._isSetup && typeof service.setup === 'function') {
			debug(`Setting up service for \`${serviceName}\``);
			service.setup(this, serviceName);
		}
		this.services[serviceName] = service;
		return this;
	}

	setup(): this {
		// Setup each service (pass the app so that they can look up other services etc.)
		Object.keys(this.services).forEach(name => {
			const service = this.services[name];

			// debug(`Setting up service for \`${name}\``);

			if (typeof service.setup === 'function') {
				service.setup(this);
			}
		});

		this._isSetup = true;

		return this;
	}
}
