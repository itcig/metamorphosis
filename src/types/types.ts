/* eslint-disable @typescript-eslint/no-empty-interface */
import fastify, { HTTPMethod, RequestHandler } from 'fastify';
import {
	KafkaConfig,
	Consumer,
	ConsumerConfig,
	EachBatchPayload,
	Producer,
	ProducerConfig,
	Message,
	Kafka,
	RecordMetadata,
	TopicMessages,
} from 'kafkajs';
import { PoolConnection, ConnectionOptions, RowDataPacket, OkPacket, FieldPacket, QueryOptions } from 'mysql2';
import { EventEmitter } from 'events';
import { ApplicationServer } from '../server/server';
import { DatabaseBaseClient } from '../database-adapters/adapter';
import { SchemaRegistryAPIClientArgs, SchemaRegistryAPIClientOptions } from '@kafkajs/confluent-schema-registry/dist/api';
import { isInteger } from 'lodash';
import { DatabaseMysqlPoolClient } from '../database-adapters/mysql-pool/mysql-pool.class';

// Make kafkajs types available
export * from 'kafkajs';

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

export type GenericOptions = { [key: string]: any };

export type GenericObject = { [key: string]: any };

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

// A mapping of other service names to types. Will be extended in service files.
export interface OtherTypes {}

export type ServiceTypes = ConsumerTypes & ProducerTypes & OtherTypes;

// type Service<T> = ServiceOverloads<T> & ServiceAddons<T> & ServiceMethods<T>;

// type ServiceMixin = (service: Service<any>, path: string) => void;

export type ApplicationSettings = {
	client?: Kafka;
	server?: ApplicationServer;
	database?: DatabaseBaseClient;
	[key: string]: any;
};

export interface Application<ServiceTypes = {}> {
	version: string;

	settings: ApplicationSettings;

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

	// server(): any;

	service<L extends keyof ServiceTypes>(serviceName: L): ServiceTypes[L];

	service(
		serviceName: string,
		service: Partial<ServiceMethods<any> & SetupMethod> | Application
	): keyof ServiceTypes extends never ? any : never;

	use(serviceName: string, service: Partial<ServiceMethods<any> & SetupMethod> | Application, options?: any): this;
	// use(serviceName: string, service: any | Application, options?: any): this;

	kill(): Promise<void>;
}

export type InitFunction = (
	app?: Application<{}>
) => {
	[key: string]: any;
} | void;

/********************************
 ***  Service methods
 *******************************/
export interface ServiceOptions {
	id: string;
	events?: string[];
	type?: string;
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
	compression?: number;
}

export declare class ProducerService<T = any> extends Service<T> implements ServiceMethods<T> {
	options: ProducerServiceOptions;
	constructor(options: ProducerServiceOptions);
	send(message: Message): Promise<RecordMetadata[]>;
	sendMessages(messages: Message[]): Promise<RecordMetadata[]>;
	sendBatch(topicMessages: TopicMessages[]): Promise<RecordMetadata[]>;
	start(): Promise<any>;
	getTopic(): string;
	getProducer(): Producer;
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
}

/********************************
 ***  Consumer Services
 *******************************/
export interface ConsumerServiceOptions extends ServiceOptions {
	topic: string;
	messageHandler?: ConsumerMessageCallback;
	batchHandler?: ConsumerBatchCallback;
}

export declare class ConsumerService<T = any> extends Service<T> implements ServiceMethods<T> {
	options: ConsumerServiceOptions;
	constructor(options: ConsumerServiceOptions);
	start(): Promise<any>;
	stop(): Promise<void>;
	restart(): Promise<any>;
	getConsumer(): Consumer;
	getGroupId(): string;
	getTopic(): string;
	getMessageHandler(): ConsumerMessageCallback;
	getBatchHandler(): ConsumerBatchCallback | undefined;
}

export type DefaultConsumerServiceOptions = ConsumerServiceOptions;

export type SinkMysqlConsumerServiceOptions = ConsumerServiceOptions;

export type DebeziumMysqlConsumerRecordHandler = (
	name: string,
	source: GenericObject,
	op: string,
	changeData?: GenericObject,
	before?: GenericObject,
	after?: GenericObject,
	tsMs?: number
) => Promise<void>;

export interface DebeziumMysqlConsumerServiceOptions extends ConsumerServiceOptions {
	recordHandler: DebeziumMysqlConsumerRecordHandler;
}

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

/********************************
 ***  KsqlDb Services
 *******************************/
export interface KsqlDbServiceOptions extends ServiceOptions {
	host: string;
}

export declare class KsqlDbService<T = any> extends Service<T> implements ServiceMethods<T> {
	options: KsqlDbServiceOptions;
	constructor(options: KsqlDbServiceOptions);
	start(): Promise<void>;
}

/********************************
 ***  Replicator Services
 *******************************/
export interface ReplicatorServiceOptions extends ConsumerServiceOptions {
	replicaKafkaSettings: ApplicationKafkaSettings;
	batchHandler?: ConsumerBatchCallback;
}

export declare class ReplicatorService<T = any> extends Service<T> implements ServiceMethods<T> {
	options: ReplicatorServiceOptions;
	constructor(options: ReplicatorServiceOptions);
	start(): Promise<void>;
}

export type MysqlClient = DatabaseMysqlPoolClient;

// export interface Configuration {
// 	[key: string]: any;
// 	kafka: {
// 		config: ApplicationKafkaSettings;
// 	};
// }

// export interface ApplicationSettings {
// 	env?: string;
// 	databaseClient?: string;
// }

export interface RegistryConfig extends SchemaRegistryAPIClientArgs {}
export interface RegistryOptions extends SchemaRegistryAPIClientOptions {}

export interface ApplicationKafkaSettings {
	config: KafkaConfig;
	consumer: ConsumerConfig;
	producer: ProducerConfig;
	registry?: RegistryConfig;
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

export interface ServerHttpRoute {
	url: string;
	method: HTTPMethod | HTTPMethod[];
	handler?: RequestHandler;
}

export interface DatabaseConfig {
	connectionString?: string;
	config?: PoolConnection;
	options?: GenericOptions;
}

export interface DatabaseSetup {
	connectionString?: string;
	connectionConfig?: any;
	connection?: any;
}

export interface DatabaseClient {
	connect(): Promise<this>;
	query(query: string, params: Array<any> | string): Promise<any>;
	execute(query: string, params: Array<any> | string): Promise<any>;
	disconnect(): Promise<void>;
}

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

export type ConsumerBatchCallback = (payload: EachBatchPayload) => Promise<void>;

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

export type SqlInsertValues = { [key: string]: any }[];
