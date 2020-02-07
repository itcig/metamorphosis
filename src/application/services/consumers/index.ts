import { Application } from '../../../types/types';
import consumer from './default/default.service';

// Export individual consumers so they can be loaded explicitly
export { consumer };

export default function(app: Application): void {
	// Import and configure all consumers here
	app.configure(consumer);
}
