import { Application } from '../../types/types';
import consumers from './consumers';
import producers from './producers';

export default function(app: Application): void {
	app.configure(consumers);
	app.configure(producers);
}
