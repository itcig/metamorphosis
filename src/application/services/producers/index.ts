import { Application } from '../../../types/types';
import defaultProducer from './default/default.service';
import webhookProducer from './webhook/webhook.service';

export { defaultProducer, webhookProducer };

export default function(app: Application): void {
	app.configure(defaultProducer);
	app.configure(webhookProducer);
}
