import Debug from 'debug';
import mysqlClient from 'mysql2/promise';
import { DatabaseBaseClient } from '../adapter';
import { DatabaseClient, DatabaseConfig } from '../../types/types';

const debug = Debug('metamorphosis:mysql');

export class DatabaseMysqlPoolClient extends DatabaseBaseClient implements DatabaseClient {
	connection!: any;

	constructor(databaseConfig: DatabaseConfig) {
		// Instantiate DatabaseBaseClient
		super(databaseConfig);
	}

	async connect(): Promise<this> {
		try {
			this.connection = mysqlClient.createPool(this.connectionConfig);

			// No need for a promise pool connection at this time
			// this.connection = await pool.getConnection();

			debug('Connected to MySql Pool');
		} catch (err) {
			console.error('MySql connection error:', err);
		}

		return this;
	}

	/**
	 * Close connection
	 */
	async disconnect(): Promise<void> {
		this.connection.end();
		debug('MySql connection closed');
	}

	/**
	 * Run a simple query against the database and return the results
	 *
	 * @param query
	 */
	async query(query: string): Promise<any> {
		debug('query', query);

		if (!query) {
			return;
		}

		try {
			return this.connection.query(query);
		} catch (err) {
			console.error(err.message);
		}
	}

	/**
	 * Build a prepared statement using a query with an array of params
	 *
	 * @param query
	 * @param params
	 */
	async execute(query: string, params: Array<any> | string = []): Promise<any> {
		debug('prepared query', query, params);

		if (!query) {
			return;
		}

		try {
			return this.connection.execute(query, params);
		} catch (err) {
			console.error(err.message);
		}
	}
}
