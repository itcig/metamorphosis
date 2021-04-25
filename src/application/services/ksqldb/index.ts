import { Application } from '../../../types/types';
import ksqldb from './ksqldb.service';

// Export ksqldb so it can be loaded explicitly
export { ksqldb };

export default function(app: Application): void {
	// Import and configure ksqldb here
	app.configure(ksqldb);
}
