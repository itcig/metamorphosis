import Debug from 'debug';
import { DatabaseMysqlPoolClient } from './mysql-pool.class';
import { Application, GenericOptions, InitFunction, DatabaseConfig } from '../../types/types';

const debugError = Debug('metamorphosis:error');

export default function init(opts?: GenericOptions): InitFunction {
	return (app?: Application): void => {
		// Do nothing if Application is not set
		if (!app) {
			return;
		}
		const configDb = app.get('config.database');

		const {
			options: configOptions,
			mysql: { config: mysqlPoolConfig },
		} = configDb || { mysql: { config: {} } };

		// Ensure the minimum values are set to create MySQL Pool
		const hasRequriedProps = ['database', 'password', 'user'].reduce((i, j) => i && j in mysqlPoolConfig, true);

		if (!hasRequriedProps) {
			debugError(`Missing required properties to create Mysql connection`, mysqlPoolConfig);
			return;
		}

		const databaseConfig: DatabaseConfig = {
			config: mysqlPoolConfig,
			...opts,
			options: configOptions,
		};

		// Initialize our service with any options it requires
		// TODO: use mixin to add database method to app object and possibly move this to main index for this plugin
		// so user would init the generic database adapater index.ts and specify which adapater(s)
		app.set('database', new DatabaseMysqlPoolClient(databaseConfig));
	};
}
