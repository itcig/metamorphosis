import Debug from 'debug';
import mysqlClient from 'mysql2/promise';
import moment from 'moment-timezone';
import { DatabaseBaseClient } from '../adapter';
import { DatabaseClient, DatabaseConfig, SqlInsertValues, GenericOptions } from '../../types/types';

const debug = Debug('metamorphosis:database');
const debugDebug = Debug('metamorphosis:database:debug');
const debugVerbose = Debug('metamorphosis:database:verbose');
const debugError = Debug('metamorphosis:error');

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

			// Set timezone for client if passed to allow for proper TIMESTAMP data
			const timeZone = this.getTimezone();
			let tzOffset;
			if (timeZone) {
				tzOffset = moment()
					.tz(this.getTimezone())
					.format('Z');

				debug(`Setting timezone to ${timeZone} (${tzOffset})`);
			} else {
				tzOffset = moment().format('Z');

				debug(`Setting timezone to server default (${tzOffset})`);
			}

			// Set time_zone for session
			await this.connection.query('SET SESSION time_zone=?;', [tzOffset]);
		} catch (err) {
			debugError('MySql connection error', err);
			throw err;
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
	async query(query: string, params: Array<any> | string = []): Promise<any> {
		// debugVerbose('Query: %s', mysqlClient.format(query, params));
		debugDebug('Query: %s', query);

		if (!query) {
			return;
		}

		try {
			return await this.connection.query(query, params);
		} catch (err) {
			debugError(err.message);
			throw err;
		}
	}

	/**
	 * Build a prepared statement using a query with an array of params
	 *
	 * @param query
	 * @param params
	 */
	async execute(query: string, params: Array<any> | string = []): Promise<any> {
		// debugVerbose('Prepared query: %s', mysqlClient.format(query, params));
		debugDebug('Prepared query: %s', query);

		if (!query) {
			return;
		}

		try {
			return await this.connection.execute(query, params);
		} catch (err) {
			debugError(err.message);
			throw err;
		}
	}

	/**
	 * Insert a record into a database table
	 *
	 * As of right now, we explicitly prevent the ability to insert into different databases on the same connection.
	 * This may change in a future release, but likely points to an issue with your consumer application design if
	 * it is modifying data in multiple database.
	 *
	 * @param insertData
	 * @param tableName
	 * @param insertOptions
	 */
	async insert(insertData: SqlInsertValues, tableName?: string, insertOptions?: GenericOptions): Promise<any> {
		const { database: dbName } = this.connectionConfig;

		// Get table name and remove database prefix if specific in tableName to avoid cross-database inserts
		const dbTableName = (tableName || '').split('.').pop();

		const {
			insert: { mode },
			// pk,
		} = insertOptions || { insert: {} };

		// Throw error if no table passed nor found in config
		if (!dbTableName) {
			throw new Error(`Cannot insert into database without table specifcied`);
		}

		// Since insert records in array must contain the same fields, get the schema from the first row
		const fields = Object.keys(insertData[0]);

		// Create array of rowValues in the same order as fields to ensure identical ordering of all row values for multiple inserts
		const rowValues: any[][] = insertData.map(row => {
			// Remove object keys not in fields array
			row = Object.keys(row)
				.filter(field => fields.includes(field))
				.reduce((obj, field) => ({ ...obj, [field]: row[field] }), {});

			// Ensure fields are in same order as fields
			return fields.map(field => row[field] || null);
		});

		// Build SQL insert
		const insertSql = `insert ${mode === 'insertignore' ? 'ignore' : ''} into ${dbName}.${dbTableName} (${fields.join(',')}) VALUES ?`;

		// TODO: This needs a lot of work to handle multiple values being passed
		// if (mode === 'upsert') {
		// 	insertSql += ` on duplicate key update set ?`;
		// }

		// Run SQL insert
		return await this.query(insertSql, [rowValues]);
	}
}
