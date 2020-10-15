import { Application } from '../../../types/types';
import replicator from './replicator.service';

// Export replicator so they can be loaded explicitly
export { replicator };

export default function(app: Application): void {
	// Import and configure replicator here
	app.configure(replicator);
}
