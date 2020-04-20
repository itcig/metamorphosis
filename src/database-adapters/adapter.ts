import { get } from 'lodash';
import deepmerge from 'deepmerge';
import { DatabaseSetup, DatabaseConfig, GenericOptions } from '../types/types';

export class DatabaseBaseClient implements DatabaseSetup {
	/** Database connection string */
	connectionString?: string;

	/** Database connection config */
	connectionConfig?: any;

	/** General options that are not adapter specific */
	options: GenericOptions;

	// /** Database connection object */
	// connection: any;

	constructor(databaseConfig: DatabaseConfig) {
		const { connectionString, config, options } = databaseConfig;

		this.connectionString = connectionString;
		this.connectionConfig = config;

		this.options = options || {};
	}

	getConfig = (key?: string): any => (this.options && key ? get(this.options, key) : this.options);

	setConfig = (overrideOptions: GenericOptions): this => {
		this.options = deepmerge(this.options, overrideOptions);
		return this;
	};

	getTimezone = (): string | undefined => this.options.timeZone;
}
