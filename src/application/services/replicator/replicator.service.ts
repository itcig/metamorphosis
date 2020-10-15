// Initializes the `Replicator` service
import { ReplicatorService } from './replicator.class';
import { Application, ReplicatorServiceOptions } from '../../../types/types';

// TODO: Allow passing in 2nd arg for options that will get merged with defaults
const replicator = function(app: Application): void {
	// Get Kafka config for primary consumer
	const kafkaSettings = app.get('config.kafka');

	const replicaKafkaSettings = app.get('config.kafkaReplica');

	// Get default consumer topic
	const {
		consumer: { topic: defaultTopic, fromBeginning },
	} = kafkaSettings || { consumer: {} };

	const options: ReplicatorServiceOptions = {
		id: 'replicator',
		type: 'replicator',
		kafkaSettings,
		replicaKafkaSettings,
		topic: defaultTopic,
		fromBeginning: fromBeginning,
	};

	// Initialize our service with any options it requires
	// TODO: Define route that can be produced to
	app.use('replicator', new ReplicatorService(options, app));

	// Get our initialized service so that we can register hooks
	// const service = app.service('Replicator');

	// service.hooks(hooks);
};

export { replicator };

export default replicator;
