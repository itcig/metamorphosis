import assert from 'assert';
import Debug from 'debug';
import { Message, logLevel } from 'kafkajs';
import waitFor from 'kafkajs/src/utils/waitFor';
import metamorphosis, { configuration, consumers, producers } from '../../src';
import { MysqlConsumer } from '../../src/application/services/consumers';
// import { MysqlPoolDatabaseAdapater } from '../../src/database-adapters/';
import { Application } from '../../src/types/types';
// import { SingleTopicConsumer } from '../../src/consumers';
// import { DatabaseMysqlPoolClient } from '../../src/database/clients';

const debug = Debug('metamorphosis:test');

const config = require('../config');

// TODO: Update this config to mirror new structure
const { simpleConsumerConfig, mysqlConsumerConfig } = config;

const getRandomNumber = (): number => Math.round(Math.random() * 1000);

const createMessage = (num: number): Message => ({
	key: Buffer.from(`key-${num}`),
	value: Buffer.from(`value-${num}-${new Date().toISOString()}`, 'utf8'),
});

const waitForMessages = (buffer: Message[], { number = 1, delay = 50 } = {}): Promise<boolean> =>
	waitFor(() => (buffer.length >= number ? buffer : false), {
		delay,
		ignoreTimeout: true,
	});

describe('Single Topic Consumer', () => {
	describe('#singleTopicConsumer()', () => {
		const app: Application = metamorphosis();

		// Load app configuration
		app.configure(configuration());

		// Set up our services
		app.configure(consumers);
		app.configure(producers);

		const consumedMessages: Message[] = [];
		let firstMessageReceived = false;
		// const offsets: number[] = [];

		const testMessages = Array(getRandomNumber())
			.fill(0)
			.map(() => createMessage(getRandomNumber()));

		before(async () => {
			app.services.defaultConsumer.setConfig({
				...simpleConsumerConfig,
				messageHandler: (message: Message) => {
					consumedMessages.push(message);
					if (!firstMessageReceived) {
						firstMessageReceived = true;
					}
				},
			});

			await app.services.defaultConsumer.start();
		});

		after(async () => {
			await app.services.defaultConsumer.stop();
		});

		it(`should be able to produce ${testMessages.length} messages`, async () => {
			try {
				await app.services.defaultProducer.start();

				await app.services.defaultProducer.sendMessages(testMessages);

				debug(`First consumed message (of ${consumedMessages.length})`, consumedMessages[0]);

				await waitForMessages(consumedMessages, {
					number: testMessages.length,
				});
			} catch (err) {
				console.error(`[test/producer] ${err.message}`, err);
			}

			// console.log(consumedMessages[0], {
			// 	// partition: 0,
			// 	key: testMessages[0].key,
			// 	value: testMessages[0].value,
			// });

			// console.log(consumedMessages, testMessages);

			assert.deepEqual(
				Object.keys(consumedMessages[0])
					.filter(key => ['key', 'value'].includes(key))
					.reduce((obj, key) => {
						obj[key] = consumedMessages[0][key];
						return obj;
					}, {}),
				{
					// partition: 0,
					key: testMessages[0].key,
					value: testMessages[0].value,
				}
			);

			// check if all offsets are present
			assert.deepEqual(
				consumedMessages.map(m => m.key),
				testMessages.map(m => m.key)
				// consumedMessages.map(m => m.offset),
				// testMessages.map((_, i) => `${i}`),
			);
		});

		// it(`should be able to produce 1 failed message`, async () => {
		// 	try {
		// 		await app.services.defaultProducer.send({
		// 			key: { bad: 'key' },
		// 			value: Buffer.from(`value-bad-message-${new Date().toISOString()}`, 'utf8'),
		// 		});
		// 	} catch (err) {
		// 		console.error(`[test/producer] ${err.message}`, err);
		// 	}
		// });

		it('should be able to wait', done => {
			const messagesChecker = setInterval(() => {
				if (consumedMessages.length > 1) {
					clearInterval(messagesChecker);
					done();
				}
			}, 100);
		});

		it('should have received first message', done => {
			assert.ok(firstMessageReceived);
			done();
		});

		it(`should be able to consume ${testMessages.length} messages`, done => {
			assert.equal(consumedMessages.length, testMessages.length);
			assert.ok(!Buffer.isBuffer(consumedMessages[0]));
			done();
		});
	});
});

describe('Database Consumer', () => {
	describe('#databaseConsumer()', () => {
		const app: Application = metamorphosis();

		// Load app configuration
		app.configure(configuration());

		// Set up our services
		app.configure(consumers);
		app.configure(producers);

		const dbInserts: any[] = [];
		const consumedMessages: Message[] = [];
		let startingTableId = 0;

		// const firstMessageReceived = false;
		// const offsets: number[] = [];

		const testMessages = Array(getRandomNumber())
			.fill(0)
			.map(() => createMessage(getRandomNumber()));

		before(async () => {
			// Below two statements only needed for test, normally this would be set in env and configured at load
			if (mysqlConsumerConfig.database && mysqlConsumerConfig.database.mysql) {
				app.merge('database.mysql', mysqlConsumerConfig.database.mysql);
			}

			// Reconfigure MysqlConsumer after updating config
			app.configure(MysqlConsumer);

			// Set config for Mysql Consumer
			app.services.mysqlConsumer.setConfig({
				...mysqlConsumerConfig,
				// queries: (message: Message) => [[`insert into messages (message) values (?)`, [JSON.stringify(message)]]];

				// Use standard function so `this` refers to the consumer class which is passed in at runtime
				messageHandler: async function(message: Message): Promise<void> {
					consumedMessages.push(message);

					const result = await this.execute(`insert into messages (message) values (?)`, [JSON.stringify(message)]);
					dbInserts.push(result);
				},
			});

			// TODO: This is not working due to "'this' implicitly has type 'any' because it does not have a type annotation."
			// app.services.mysqlConsumer.setMessageHandler(async function(message: Message): Promise<void> {
			// 	console.log('HANDLER 2', this, message);
			// 	consumedMessages.push(message);

			// 	const result = await this.execute(`insert into messages (message) values (?)`, [JSON.stringify(message)]);
			// 	dbInserts.push(result);
			// });

			// Start the consumer
			await app.services.mysqlConsumer.start();
		});

		after(async () => {
			await app.services.mysqlConsumer.stop();
		});

		it(`should be able to connect to the database`, async () => {
			const databaseClient = app.get('mysqlAdapter');
			await databaseClient.dbConnect();
			assert.ok(true);
		});

		it(`should be able to view the database`, async () => {
			const databaseClient = app.get('mysqlAdapter');
			const [rows, fields] = await databaseClient.query('show databases');
			assert.ok(rows);
		});

		it(`should be able to query the database`, async () => {
			const databaseClient = app.get('mysqlAdapter');

			const start = +new Date();

			const queryResultSingle = await databaseClient.query('select sleep(0.5)');

			const [rows, fields] = await databaseClient.query('select max(id) as maxId from messages');

			startingTableId = rows[0].maxId || 0;

			const end = +new Date();

			assert.ok(queryResultSingle, `Query executed in ${end - start}ms`);
		});

		it(`should be able to run concurrent pool queries`, async () => {
			const databaseClient = app.get('mysqlAdapter');

			const start = +new Date();

			const queryResultParallel = await Promise.all([
				databaseClient.query('select sleep(2.5)'),
				databaseClient.query('select sleep(2.5)'),
			]);

			const end = +new Date();

			assert.ok(queryResultParallel, `Queries executed in ${end - start}ms`);
		});

		it(`should be able to insert ${testMessages.length} messages`, async () => {
			try {
				await app.services.defaultProducer.start();

				await app.services.defaultProducer.sendMessages(testMessages);

				debug(`First consumed message (of ${consumedMessages.length})`, consumedMessages[0]);

				await waitForMessages(consumedMessages, {
					number: testMessages.length,
				});
			} catch (err) {
				console.error(`[test/producer] ${err.message}`, err);
			}

			// console.log('# Messages produced:', consumedMessages.length);
			// console.log(dbInserts);

			const numInsertedRows = dbInserts.map(row => row[0].affectedRows).reduce((total, numInserts) => total + numInserts, 0);

			assert.equal(numInsertedRows, testMessages.length);
		});

		it(`should be able to read ${testMessages.length} messages from database`, async () => {
			const databaseClient = app.get('mysqlAdapter');
			const [rows, fields] = await databaseClient.execute('select count(0) as num from messages where id > ?', [startingTableId]);
			assert.equal(rows[0].num, testMessages.length);
		});

		it(`should be able to close the database connection`, async () => {
			const databaseClient = app.get('mysqlAdapter');
			await databaseClient.close();

			const databaseConnection = databaseClient.connection;

			assert.ok(databaseConnection.pool._closed);
		});
	});
});
