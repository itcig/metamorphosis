import { Application } from '../../types/types';
import consumers from './consumers';
import ksqldb from './ksqldb';
import producers from './producers';
import replicator from './replicator';

export default function(app: Application): void {
	app.configure(consumers);
	app.configure(ksqldb);
	app.configure(producers);
	app.configure(replicator);
}
