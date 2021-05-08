import Debug from 'debug';
import axios from 'axios';
import diff, { Diff } from 'fast-diff';
import colors from 'colors';
import SqlMinify from 'pg-minify';
import { Service } from '../service.class';
import { Application, GenericObject, KsqlDbServiceOptions, ServiceOptions } from '../../../types/types';

export class KsqlDbService extends Service {
	options: ServiceOptions;

	datasources: GenericObject[] | undefined;

	queries: GenericObject[] | undefined;

	prevCommandSequenceNumber: number | null;

	/**
	 * ReplicatorService constructor
	 *
	 * @param options
	 * @param app
	 */
	constructor(options: KsqlDbServiceOptions, app: Application) {
		// Instantiate Service
		super(options, app);

		// Store
		this.options = options;

		// Save the last command sequence number
		this.prevCommandSequenceNumber = null;
	}

	/**
	 * Run KsqlDB command
	 *
	 * @param ksql string
	 */
	async apiCall(endpoint: string, ksql: string, properties?: GenericObject): Promise<GenericObject[]> {
		try {
			Debug('metamorphosis:ksqldb:execute:verbose')('ksqlDB API call to %s/%s: %s', this.options.host, endpoint, ksql);

			const { streamsProperties, headers } = properties || { streamsProperties: {}, headers: {} };

			const response = await axios.post(
				`${this.options.host}/${endpoint}`,
				{
					ksql,
					...(this.prevCommandSequenceNumber && { commandSequenceNumber: this.prevCommandSequenceNumber }),
					streamsProperties: {
						'ksql.streams.auto.offset.reset': 'earliest',
						...streamsProperties,
					},
				},
				{
					...(this.options.auth && { auth: this.options.auth }),
					headers: {
						Accept: 'application/vnd.ksql.v1+json',
						'Content-Type': 'application/vnd.ksql.v1+json',
						...headers,
					},
				}
			);

			const { data: responseData } = response || {};

			Debug('metamorphosis:ksqldb:execute:verbose')('ksqlDB API response: %o', responseData);

			return responseData;
		} catch (err) {
			const { response } = err || {};
			const {
				data: { message },
				status,
			} = response || { data: { message: err.message }, status: null };

			Debug('metamorphosis:error')(`ksqlDB API call failed (%s): %s`, status, message);

			throw err;
		}
	}

	/**
	 * Load ksqlDB resources needed for lookups and updates
	 */
	async loadResources(): Promise<void> {
		this.datasources = await this.getDataSources();

		this.queries = await this.getQueries();

		// Define session variables if set in config
		await this.defineVariables();
	}

	/**
	 * Get existing source objects
	 */
	async getDataSources(detail = false): Promise<GenericObject[]> {
		const objectTypes: GenericObject[] = await this.apiCall(
			'ksql',
			`SHOW TABLES${detail ? ' EXTENDED' : ''}; SHOW STREAMS${detail ? ' EXTENDED' : ''};`
		);

		const objects = objectTypes.map(objectType => objectType[objectType['@type']] || []).reduce((obj, item) => [...obj, ...item], []);

		Debug('metamorphosis:ksqldb:load:verbose')('Existing resources: %o', objects);

		return objects;
	}

	/**
	 * Get existing source objects
	 */
	async getQueries(detail = false): Promise<GenericObject[]> {
		const objectTypes: GenericObject[] = await this.apiCall('ksql', `SHOW QUERIES${detail ? ' EXTENDED' : ''};`);

		const objects = objectTypes.map(objectType => objectType[objectType['@type']] || []).reduce((obj, item) => [...obj, ...item], []);

		Debug('metamorphosis:ksqldb:load:verbose')('Existing queries: %o', objects);

		return objects;
	}

	/**
	 * Define KsqlDB variables
	 */
	async defineVariables(): Promise<void> {
		Debug('metamorphosis:ksqldb:load:debug')('Defining variables: %o', this.options.variables);

		if (this.options.variables) {
			const statements = Object.keys(this.options.variables).map(
				(key: string) => `DEFINE ${key} = '${this.options.variables[key]}';`
			);

			try {
				await this.apiCall('ksql', statements.join(' '));
			} catch (err) {
				Debug('metamorphosis:error')(`Defining ksqlDB variables failed: %o`, err);

				throw new Error(err.message);
			}
		}
	}

	/**
	 * Remove defined KsqlDB variables
	 */
	async undefineVariables(): Promise<void> {
		Debug('metamorphosis:ksqldb:unload:debug')('Removing variables: %o', this.options.variables);

		if (this.options.variables) {
			const statements = Object.keys(this.options.variables).map((key: string) => `UNDEFINE ${key};`);

			try {
				await this.apiCall('ksql', statements.join(' '));
			} catch (err) {
				Debug('metamorphosis:error')(`Removing ksqlDB variables failed: %o`, err);

				throw new Error(err.message);
			}
		}
	}

	/**
	 * Execute ksql statement
	 *
	 * @param ksql
	 */
	async execute(ksql: string): Promise<GenericObject[]> {
		let executeResponse: GenericObject[] = [];

		// Create or Replace
		if (ksql.match(/^create( or replace)? (stream|table)/gim)) {
			executeResponse = await this.create(ksql);

			// Insert Into
		} else if (ksql.match(/^insert into/gim)) {
			// Get the datasource from the query
			const datasource: string | null = this.getDatasource(ksql);

			const existingQueries: GenericObject[] | undefined = this.queries?.filter(
				item => Array.isArray(item.sinks) && item.sinks.includes(datasource?.toUpperCase())
			);

			Debug('metamorphosis:ksqldb:create:verbose')(`Found existing queries with matching data sink: %o`, existingQueries);

			// Get FROM datasource of a passed-in query
			const stmtFromMatches = /(?:from)\s(\w+)/gim.exec(ksql);

			const stmtFromDatasource = stmtFromMatches && stmtFromMatches.length > 1 ? stmtFromMatches[1] : null;

			// Flag used to determine if either a matching query is found and removed or no match is found
			const shouldQueryRun = true;

			// TODO: This cannot identify the query properly as their is no dedicated name/Id and will find false matches
			// 			with current logic.
			//
			// if (existingQueries) {
			// 	for (const existingQuery of existingQueries) {
			// 		// Get FROM datasource from found query
			// 		const existingFromMatches = /(?:from)\s(\w+)/gim.exec(existingQuery.queryString);

			// 		const existingFromDatasource = existingFromMatches && existingFromMatches.length > 1 ? existingFromMatches[1] : null;

			// 		if (stmtFromDatasource?.toLowerCase() !== existingFromDatasource?.toLowerCase()) {
			// 			Debug('metamorphosis:ksqldb:create:verbose')('Datasources in FROM clause do not match: %O', [
			// 				stmtFromDatasource,
			// 				existingFromDatasource,
			// 			]);

			// 			continue;
			// 		}

			// 		const comparison = this.compareKsql(existingQuery.queryString, ksql);

			// 		Debug('metamorphosis:ksqldb:create:verbose')(
			// 			'Comparing existing datasource statement and new one for changes: %o',
			// 			comparison
			// 		);

			// 		// Only execute ksql if there are changes
			// 		if (comparison.isDifferent && comparison.changes && Array.isArray(comparison.changes)) {
			// 			Debug('metamorphosis:ksqldb:create:info')(`Insert query changes: %s`, comparison.changes.join(' '));

			// 			// This is a hack, but we have no better way to detect changes to an INSERT query so assume
			// 			// that too many changes equates to a non-match
			// 			if (comparison.isDifferent >= 100) {
			// 				Debug('metamorphosis:ksqldb:create:debug')(
			// 					`Insert query is too different from found query, not considering a match`
			// 				);
			// 			} else {
			// 				// Drop and recreate the query
			// 				await this.terminate(existingQuery.id);
			// 			}
			// 		} else {
			// 			// Since a matching query was found and no changes, we should run our initial insert statement
			// 			shouldQueryRun = false;

			// 			Debug('metamorphosis:ksqldb:create:info')(`No changes to insert query`); // '%s', skipping`, datasource);
			// 		}
			// 	}
			// } else {
			// 	// No existing queries found
			// 	shouldQueryRun = true;
			// }

			if (shouldQueryRun) {
				executeResponse = await this.apiCall('ksql', ksql);
			}

			// Drop
		} else if (ksql.match(/^drop (stream|table)/gim)) {
			const datasource = this.getDatasource(ksql);

			if (!datasource) {
				throw new Error(`Cannot drop datasource, unable to parse query.`);
			}

			// Whether to perform full delete on topic and po as well (default false)
			const deleteTopic = ksql.toLowerCase().indexOf('delete topic') !== -1;

			executeResponse = await this.drop(datasource, deleteTopic);

			// Describe
		} else if (ksql.match(/^describe[\s\w_]+?(extended)?/gim)) {
			const datasource = this.getDatasource(ksql);

			if (!datasource) {
				throw new Error(`Cannot fetch datasource, unable to parse query.`);
			}

			const detailDescription = ksql.toLowerCase().indexOf('extended') !== -1;

			const describeResponse = await this.describe(datasource, detailDescription);

			return [
				{
					commandStatus: 'OK',
					commandMessage: `Details for datasource '${datasource}`,
					commandData: describeResponse,
				},
			];

			// Other
		} else {
			executeResponse = await this.apiCall('ksql', ksql);
		}

		const executedCommands: GenericObject[] = [];

		if (executeResponse.length) {
			for (const record of executeResponse) {
				if (`commandStatus` in record) {
					const {
						commandSequenceNumber = null,
						commandStatus: { status = '', message = '' },
					} = record;

					// Set command sequence number so the next query can wait until the previous command finishes
					this.prevCommandSequenceNumber = commandSequenceNumber;

					// Refactor response to move status and message to top-level
					executedCommands.push({
						commandSequenceNumber,
						commandStatus: status,
						commandMessage: message,
						commandData: record,
					});
				}
			}
		}

		return executedCommands;
	}

	/**
	 * Create or replace a ksqlDB datasource (stream/table)
	 *
	 * @param ksql
	 */
	async create(ksql: string): Promise<GenericObject[]> {
		Debug('metamorphosis:ksqldb:create:debug')('Executing query: %s', ksql);

		// Get the datasource from the query
		const datasource: string | null = this.getDatasource(ksql);

		// Check if datasource already exists and ignore or replace if it has changed
		if (datasource && this.datasources?.findIndex(item => item.name.toLowerCase() === datasource?.toLowerCase()) !== -1) {
			Debug('metamorphosis:ksqldb:create:debug')(`Datasource '%s' already exists`, datasource);

			const datasourceDescription = await this.describe(datasource, true);

			Debug('metamorphosis:ksqldb:create:verbose')('Datasource details: %o', datasourceDescription);

			const { statement } = datasourceDescription || {};

			const comparison = this.compareKsql(statement, ksql);

			Debug('metamorphosis:ksqldb:create:verbose')('Comparing existing datasource statement and new one for changes: %o', comparison);

			// Only execute ksql if there are changes
			if (comparison.isDifferent && comparison.changes && Array.isArray(comparison.changes)) {
				Debug('metamorphosis:ksqldb:create:info')(`Datasource '%s' query changes: %s`, datasource, comparison.changes.join(' '));

				// Whether to perform recreate and full delete on topic and schema as well (default false)
				const shouldRecreate = ksql.toLowerCase().indexOf('create or replace') !== -1;

				// Drop and recreate the datasource
				if (shouldRecreate) {
					return await this.recreate(datasource, ksql);
				} else {
					Debug('metamorphosis:ksqldb:create:info')(
						`Cannot replace existing datasource '%s' without CREATE OR REPLACE statment.`,
						datasource
					);
					return [];
				}
			} else {
				Debug('metamorphosis:ksqldb:create:info')(`No changes to datasource '%s', skipping`, datasource);

				return [];
			}
		} else {
			Debug('metamorphosis:ksqldb:create:info')(`Creating datasource '%s'`, datasource);

			// Create new datasource
			const createResponse = await this.apiCall('ksql', ksql);

			if (createResponse && datasource) {
				const createDatasourceDetails = await this.describe(datasource);

				const { type, topic, valueFormat } = createDatasourceDetails || {};

				const newDatasource = {
					type,
					name: datasource,
					topic,
					format: valueFormat,
				};

				// Remove datasource from array of existing datasources
				this.datasources = [...(Array.isArray(this.datasources) ? this.datasources : []), newDatasource];
			}

			return createResponse;
		}
	}

	/**
	 * Drop an existing stream or table and its underlying queries
	 *
	 * @param datasource
	 * @param ksql
	 * @return Create statement response
	 */
	async recreate(datasource: string, ksql: string): Promise<any> {
		Debug('metamorphosis:ksqldb:recreate:info')(`Recreating datasource '%s'`, datasource);

		// Delete topic if it was created for this datasource
		// A backing topic that is created by the kstream/ktable will always specify `partitions`
		const shouldDeleteTopic = ksql.toLowerCase().indexOf('kafka_topic=') !== -1 && ksql.toLowerCase().indexOf('partitions=') !== -1;

		// First drop existing datasource and topic
		await this.drop(datasource, shouldDeleteTopic);

		// Then execute create statment again
		return await this.create(ksql);
	}

	/**
	 * Drop an existing stream or table and its underlying queries
	 *
	 * @param datasource
	 * @param deleteTopic Whether to delete the underlying topic and schema (if exists)
	 */
	async drop(datasource: string, deleteTopic = false): Promise<GenericObject[]> {
		Debug('metamorphosis:ksqldb:drop:debug')(
			`Dropping datasource '%s' and all queries. %s`,
			datasource,
			deleteTopic ? 'Also dropping underlying topic and schema.' : ''
		);

		const sourceDescription = await this.describe(datasource, true);

		const { type: objectType, readQueries, writeQueries } = sourceDescription || {};

		const queries: string[] = [...writeQueries, ...readQueries].map((item: GenericObject) => item.id);

		for (const query of queries) {
			await this.terminate(query);
		}

		const dropResponse = await this.apiCall(
			'ksql',
			`DROP ${objectType} IF EXISTS ${datasource} ${deleteTopic ? ' DELETE TOPIC' : ''};`
		);

		Debug('metamorphosis:ksqldb:drop:info')(`Dropped %s '%s'`, objectType, datasource);

		if (dropResponse) {
			// Remove datasource from array of existing datasources
			this.datasources = this.datasources?.filter(
				(item: GenericObject) => item && item.name.toLowerCase() !== datasource?.toLowerCase()
			);
		}

		return dropResponse;
	}

	/**
	 * Get resource details
	 *
	 * @param datasource Datasource to describe
	 * @param detail Query `EXTENDED` resource description
	 * @returns
	 */
	async describe(datasource: string, detail = false): Promise<GenericObject> {
		const description = await this.apiCall('ksql', `DESCRIBE ${datasource} ${detail ? ' EXTENDED' : ''};`);

		const { sourceDescription } = (description && description[0]) || {};

		Debug('metamorphosis:ksqldb:describe:verbose')(`Source description for '%s': %o`, datasource, sourceDescription);

		return sourceDescription;
	}

	/**
	 * Stop and remove a query
	 *
	 * @param query Name of query resource
	 * @returns
	 */
	async terminate(query: string): Promise<GenericObject[]> {
		const response = await this.apiCall('ksql', `TERMINATE ${query};`);

		Debug('metamorphosis:ksqldb:terminate:info')(`Terminated '%s'`, query);

		return response;
	}

	/**
	 * Disconnect from both producer and consumer
	 */
	async stop(): Promise<void> {
		// TODO: Add for ksqlDB 0.14.0+
		// await this.undefineVariables();
		Debug('metamorphosis:runtime')(`ksqlDB finished`);
	}

	/**
	 * Extract the kslDB datasource from ksql statement
	 *
	 * @param ksql
	 */
	getDatasource(ksql: string): string | null {
		const matches = /(?:(?:create(?: or replace)? (?:stream|table))|(?:insert into)|(?:drop (?:stream|table)(?: if exists)?)|(?:insert into)|(?:describe(?: extended)?))\s(\w+)/gim.exec(
			ksql
		);

		const datasource = matches && matches.length > 1 ? matches[1] : null;

		// TODO: Get datasource from defined variables if using a token ${}
		// console.log(datasource, this.options.variables);

		return datasource;
	}

	/**
	 * Normalize a ksql statement, stripping comments, whitespace and normalizing syntax for performing diffs
	 * @param ksql
	 * @return The normalized KSQL string
	 */
	normalizeKsql(ksql: string): string {
		// Clean up comments, mixed-casing, escape sequences, string concatenation and extra spaces
		ksql = ksql
			.replace(/^\s+?\-\-.*$/gm, '')
			.replace(/(\r\n|\n|\r)/gm, '')
			.replace(/(?:'|")[\s\+]+(?:'|")/gm, '')
			.replace(/\s+/g, ' ')
			.trim();

		// Use pg-minify to normalize SQL syntax and remove remaining comments
		return SqlMinify(ksql);
	}

	/**
	 *
	 * @param currentKsql
	 * @param newKsql
	 */
	compareKsql(currentKsql: string, newKsql: string): GenericObject {
		// Normalize and remove all spaces for diff comparison
		const testCurrent = this.normalizeKsql(currentKsql).toLowerCase();
		const testNew = this.normalizeKsql(newKsql).toLowerCase();

		// Compare sanitized ksql statement to current datasource ksql
		const comparison: Diff[] = diff(testCurrent, testNew);

		Debug('metamorphosis:ksqldb:compareksql:verbose')('Diff result: %o', comparison);

		let numChanges = 0;
		const changes: string[] | null =
			comparison && comparison.length
				? comparison
						// Remove changes that are just whitespace
						.filter((item: any[]) => item.length > 1 && item[1].trim().length)
						.map((item: any[]) => {
							// Increment change counter if different
							if (item[0] !== 0) {
								numChanges++;
							}
							return item[0] === -1 ? colors.red.strikethrough(item[1]) : item[0] === 1 ? colors.green(item[1]) : item[1];
						})
				: null;

		const result: GenericObject = {
			isDifferent: numChanges,
			...(numChanges && { changes }),
		};

		return result;
	}
}
