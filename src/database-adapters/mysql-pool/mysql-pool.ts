import Debug from 'debug';
import { DatabaseMysqlPoolClient } from './mysql-pool.class';
import { Application, DatabaseConfig } from '../../types/types';

const debugErrors = Debug('metamorphosis.errors');

export default function(app: Application): void {
	const databaseConfig = app.get('config.database');

	const {
		mysql: { config: mysqlPoolConfig },
	} = databaseConfig || { mysql: { config: {} } };

	// Ensure the minimum values are set to create MySQL Pool
	const hasRequriedProps = ['database', 'password', 'user'].reduce((i, j) => i && j in mysqlPoolConfig, true);

	if (!hasRequriedProps) {
		debugErrors(`Missing required properties to create Mysql connection`, mysqlPoolConfig);
		return;
	}

	const options: DatabaseConfig = {
		config: mysqlPoolConfig,
	};

	// Initialize our service with any options it requires
	// TODO: Define route that can be produced to
	app.set('mysqlAdapter', new DatabaseMysqlPoolClient(options));
}
