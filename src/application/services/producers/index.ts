import { Application } from '../../../types/types';
import producer from './default/default.service';

// Export individual producers so they can be loaded explicitly
export { producer };

export default function(app: Application): void {
	// Import and configure all producers here
	app.configure(producer);
}
