import { Application } from '../../../types/types';
import DefaultConsumer from './default/default.service';
import MysqlConsumer from './mysql/mysql.service';

export { DefaultConsumer, MysqlConsumer };

export default function(app: Application): void {
	app.configure(DefaultConsumer);
	app.configure(MysqlConsumer);
}
