import { Application } from '../../types/types';
import Consumers from './consumers';
import Producers from './producers';

export default function(app: Application): void {
	app.configure(Consumers);
	app.configure(Producers);
}
