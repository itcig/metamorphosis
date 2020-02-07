import { DatabaseSetup, DatabaseConfig } from '../types/types';

export class DatabaseBaseClient implements DatabaseSetup {
	/** Database connection string */
	connectionString?: string;

	/** Database connection config */
	connectionConfig?: any;

	// /** Database connection object */
	// connection: any;

	constructor(databaseConfig: DatabaseConfig) {
		const { connectionString, config } = databaseConfig;

		this.connectionString = connectionString;
		this.connectionConfig = config;
	}

	// async dbConnect(): Promise<void> {
	// 	console.error('Error: Attempting to connect to database interface instead of specific client');
	// 	return;
	// }
}
