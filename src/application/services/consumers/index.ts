import { Application } from '../../../types/types';
import defaultConsumer from './default/default.service';
import mysqlConsumer from './mysql/mysql.service';

export { defaultConsumer, mysqlConsumer };

export default function(app: Application): void {
	app.configure(defaultConsumer);
	app.configure(mysqlConsumer);
}
