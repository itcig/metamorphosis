/* eslint-disable @typescript-eslint/no-empty-interface */
import * as fastify from 'fastify';
import { KafkaConfig, ConsumerConfig, ProducerConfig, Message, Kafka } from 'kafkajs';
import { PoolConnection, ConnectionOptions, RowDataPacket, OkPacket, FieldPacket, QueryOptions } from 'mysql2';
import { EventEmitter } from 'events';
import * as http from 'http';

// export interface KafkaApp {
// 	/**
// 	 * Initialize the server.
// 	 */
// 	init(): void;

// 	/**
// 	 * Initialize application configuration.
// 	 */
// 	defaultConfiguration(): void;

// 	configure(config: any): void;

// 	/**
// 	 * Assign `setting` to `val`, or return `setting`'s value.
// 	 *
// 	 *    app.set('foo', 'bar');
// 	 *    app.get('foo');
// 	 *    // => "bar"
// 	 *    app.set('foo', ['bar', 'baz']);
// 	 *    app.get('foo');
// 	 *    // => ["bar", "baz"]
// 	 */
// 	set(setting: string, val: any): this;
// 	get(name: string): any;

// 	getSettings(): any;

// 	settings: ApplicationSettings;
// 	// consumers?: BaseConsumer[];
// }

export type Id = number | string;

export type NullableId = Id | null;

export interface ServiceMethods<T> {
	[key: string]: any;

	get(): Service<T>;
}

export interface SetupMethod {
	setup(app: Application, serviceName: string): void;
}

export declare class Service<T> implements ServiceMethods<T> {
	client?: Kafka;
	options: ServiceOptions;
	get(): Service<T>;
	get id(): Id;
	get events(): string[];
	// allowsMulti(method: string): boolean;
}

// A mapping of consumer names to types. Will be extended in service files.
export interface ConsumerTypes {}

// A mapping of producer names to types. Will be extended in service files.
export interface ProducerTypes {}

export type ServiceTypes = ConsumerTypes & ProducerTypes;

// type Service<T> = ServiceOverloads<T> & ServiceAddons<T> & ServiceMethods<T>;

// type ServiceMixin = (service: Service<any>, path: string) => void;

export interface Application<ServiceTypes = {}> {
	version: string;

	services: keyof ServiceTypes extends never ? any : ServiceTypes;

	// mixins: ServiceMixin[];

	methods: string[];

	get(name: string): any;

	set(name: string, value: any): this;

	merge(name: string, value: any): this;

	disable(name: string): this;

	disabled(name: string): boolean;

	enable(name: string): this;

	enabled(name: string): boolean;

	getServiceConfigs(): any;

	debug(formatter: any, ...args: any[]): void;

	configure(callback: (this: this, app: this) => void): this;

	setup(server?: any): this;

	service<L extends keyof ServiceTypes>(serviceName: L): ServiceTypes[L];

	service(
		serviceName: string,
		service: Partial<ServiceMethods<any> & SetupMethod> | Application
	): keyof ServiceTypes extends never ? any : never;

	use(serviceName: string, service: Partial<ServiceMethods<any> & SetupMethod> | Application, options?: any): this;
	// use(serviceName: string, service: any | Application, options?: any): this;
}

/********************************
 ***  Service methods
 *******************************/
export interface ServiceOptions {
	id: string;
	events?: string[];
	kafkaSettings: ApplicationKafkaSettings;
	[x: string]: any; // indexer allows overloading child interfaces
}

export interface InternalServiceMethods<T = any> {
	get(): Service<T>;
	start(): Promise<void>;
	// stop(): Promise<void>;
	// clear(): Promise<void>;
}

export declare class DefaultService<T = any> extends Service<T> implements ServiceMethods<T> {
	options: ServiceOptions;
	constructor(options: ServiceOptions);
}

/********************************
 ***  Producer Services
 *******************************/
export interface ProducerServiceOptions extends ServiceOptions {
	topic: string;
	multiTopic?: string[];
}

export declare class ProducerService<T = any> extends Service<T> implements ServiceMethods<T> {
	options: ProducerServiceOptions;
	constructor(options: ConsumerServiceOptions);
}

export type DefaultProducerServiceOptions = ProducerServiceOptions;

export interface WebhookProducerServiceOptions extends ProducerServiceOptions {
	route: string;
	port: number;
	fastifyOpts?: fastify.RouteShorthandOptions;
	contentType?: string;
	logger?: any;
}

export declare class DefaultProducerService<T = any> extends ProducerService<T> implements InternalServiceMethods<T> {
	options: DefaultProducerServiceOptions;

	constructor(options?: DefaultProducerServiceOptions);
	start(): Promise<void>;
}

/********************************
 ***  Consumer Services
 *******************************/
export interface ConsumerServiceOptions extends ServiceOptions {
	topic: string;
	messageHandler?: ConsumerMessageCallback;
	multiTopic?: string[];
}

export declare class ConsumerService<T = any> extends Service<T> implements ServiceMethods<T> {
	options: ConsumerServiceOptions;
	constructor(options: ConsumerServiceOptions);
}

export type DefaultConsumerServiceOptions = ConsumerServiceOptions;

export declare class DefaultConsumerService<T = any> extends ConsumerService<T> implements InternalServiceMethods<T> {
	options: DefaultConsumerServiceOptions;

	constructor(options?: DefaultConsumerServiceOptions);
	start(): Promise<void>;
}

export interface MysqlConsumerServiceQuery {
	query: string;
	params: Array<any> | string;
}

export interface MysqlConsumerServiceOptions extends ConsumerServiceOptions {}

export declare class MysqlConsumerService<T = any> extends ConsumerService<T> implements InternalServiceMethods<T> {
	options: MysqlConsumerServiceOptions;

	constructor(options?: MysqlConsumerServiceOptions);
	start(): Promise<void>;
}

// export interface Configuration {
// 	[key: string]: any;
// 	kafka: {
// 		config: ApplicationKafkaSettings;
// 	};
// }

export interface ApplicationSettings {
	env?: string;
	databaseClient?: string;
}

export interface ApplicationKafkaSettings {
	config: KafkaConfig;
	consumer: ConsumerConfig;
	producer: ProducerConfig;
}

export interface ServerConfig {
	address: string;
	port: number;
	contentType?: string;
	logger?: any;
	fastifyOpts?: fastify.RouteShorthandOptions;
}

export interface ServerInterface {
	start(): Promise<void>;
	stop(): Promise<void>;
}

export interface DatabaseConfig {
	connectionString?: string;
	config?: PoolConnection;
}

export interface DatabaseSetup {
	connectionString?: string;
	connectionConfig?: any;
	connection?: any;
}

export interface DatabaseClient {
	dbConnect(): Promise<void>;
	query(query: string): Promise<any>;
	execute(query: string, params: Array<any> | string): Promise<any>;
	close(): Promise<void>;
}

// export interface DatabaseClient {
// 	connectionString: string;
// 	connectionConfig: any;
// 	connection: any;
// 	dbConnect(): Promise<void>;
// }

export interface DatabaseConsumer {
	connectionString: string;
	connectionConfig: any;
	connection: any;
}

// export interface Options {
// 	groupId?: string;
// 	// logger: Logger;
// }

// export interface KafkaMessage {
// 	topic: string;
// 	partition: number;
// 	offset: number;
// 	key: Buffer | string;
// 	value: Buffer | string | object;
// 	size: number;
// 	timestamp: number;
// }

export interface ProduceKafkaMessage {
	value: string;
	key?: string;
	partition?: number;
	timestamp?: number;
	headers?: {};
}

export type ConsumerMessageCallback = (message: Message) => Promise<void>;

// TODO: properly declare mysql2 module in declarations.d.ts and remove this
export interface Connection extends EventEmitter {
	config: ConnectionOptions;
	threadId: number;

	connect(): Promise<void>;
	ping(): Promise<void>;

	beginTransaction(): Promise<void>;
	commit(): Promise<void>;
	rollback(): Promise<void>;

	changeUser(options: ConnectionOptions): Promise<void>;

	query<T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[]>(sql: string): Promise<[T, FieldPacket[]]>;
	query<T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[]>(
		sql: string,
		values: any | any[] | { [param: string]: any }
	): Promise<[T, FieldPacket[]]>;
	query<T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[]>(options: QueryOptions): Promise<[T, FieldPacket[]]>;
	query<T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[]>(
		options: QueryOptions,
		values: any | any[] | { [param: string]: any }
	): Promise<[T, FieldPacket[]]>;

	execute<T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[]>(sql: string): Promise<[T, FieldPacket[]]>;
	execute<T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[]>(
		sql: string,
		values: any | any[] | { [param: string]: any }
	): Promise<[T, FieldPacket[]]>;
	execute<T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[]>(options: QueryOptions): Promise<[T, FieldPacket[]]>;
	execute<T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[]>(
		options: QueryOptions,
		values: any | any[] | { [param: string]: any }
	): Promise<[T, FieldPacket[]]>;

	unprepare(sql: string): void;

	end(options?: any): Promise<void>;

	destroy(): void;

	pause(): void;

	resume(): void;

	escape(value: any): string;

	escapeId(value: string): string;
	escapeId(values: string[]): string;

	format(sql: string, values?: any | any[] | { [param: string]: any }): string;
}

export interface PoolConnection extends Connection {
	release(): void;
}
