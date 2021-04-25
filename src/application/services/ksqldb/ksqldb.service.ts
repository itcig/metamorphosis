// Initializes the `Ksqldb` service
import { KsqlDbService } from './ksqldb.class';
import { Application, KsqlDbServiceOptions } from '../../../types/types';

// Add this service to the service type index
declare module '../../../types/types' {
	interface OtherTypes {
		KsqlDb: KsqlDbService;
	}
}

// TODO: Allow passing in 2nd arg for options that will get merged with defaults
const ksqldb = function(app: Application): void {
	// Get Kafka config for primary consumer
	const kafkaSettings = app.get('config.kafka');

	// Get default consumer topic
	const {
		ksqldb: { host, autoOffsetReset, auth, variables },
	} = kafkaSettings || { ksqldb: {} };

	const options: KsqlDbServiceOptions = {
		id: 'ksqldb',
		type: 'ksqldb',
		kafkaSettings,
		host,
		auth,
		autoOffsetReset,
		variables,
	};

	// Initialize our service with any options it requires
	// TODO: Define route that can be produced to
	app.use('ksqldb', new KsqlDbService(options, app));

	// Get our initialized service so that we can register hooks
	// const service = app.service('ksqldb');

	// service.hooks(hooks);
};

export { ksqldb };

export default ksqldb;
