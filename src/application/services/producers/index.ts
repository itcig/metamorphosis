import { Application } from '../../../types/types';
import DefaultProducer from './default/default.service';

export { DefaultProducer };

export default function(app: Application): void {
	app.configure(DefaultProducer);
}
