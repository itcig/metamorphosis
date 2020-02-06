import { Application } from '../../../types/types';
import DefaultProducer from './default/default.service';
import WebhookProducer from './webhook/webhook.service';

export { DefaultProducer, WebhookProducer };

export default function(app: Application): void {
	app.configure(DefaultProducer);
	app.configure(WebhookProducer);
}
