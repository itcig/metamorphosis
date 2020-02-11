module.exports = {
	kafka: {
		config: {
			brokers: 'localhost:9092',
			clientId: 'metamorphosis',
			logLevel: 0,
			// Time in milliseconds to wait for a successful connection. Default is 1000
			connectionTimeout: 3000,
			// Time in milliseconds to wait for a successful request. Default is 30000
			requestTimeout: 10000,
			// authenticationTimeout: 1000,
			// reauthenticationThreshold: 10000,
			// ssl: true,
			// sasl: {
			// 	mechanism: 'aws',
			// 	authorizationIdentity: 'AIDAIOSFODNN7EXAMPLE', // UserId or RoleId
			// 	accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
			// 	secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
			// },
			// If the max number of retries is exceeded the retrier will throw KafkaJSNumberOfRetriesExceeded and interrupt. Producers will bubble up the error to the user code; Consumers will wait the retry time attached to the exception (it will be based on the number of attempts) and perform a full restart.
			// retry: {
			// 	initialRetryTime: 100,
			// 	retries: 8,
			// },
		},
		consumer: {
			// Default consumer topic
			topic: '',
			// Consumer group Kafka will track current offset for
			groupId: 'metamorphosis-consumer-group',
			// Whether the topic should consume from the first or latest offset if none are found for consumer group. Default is `false`.
			fromBeginning: false,
			// Timeout in milliseconds used to detect failures. The consumer sends periodic heartbeats to indicate its liveness to the broker. If no heartbeats are received by the broker before the expiration of this session timeout, then the broker will remove this consumer from the group and initiate a rebalance
			sessionTimeout: 30000,
			// The maximum time that the coordinator will wait for each member to rejoin when rebalancing the group
			rebalanceTimeout: 60000,
			// The expected time in milliseconds between heartbeats to the consumer coordinator. Heartbeats are used to ensure that the consumer's session stays active. The value must be set lower than session timeout
			heartbeatInterval: 3000,
			// The period of time in milliseconds after which we force a refresh of metadata even if we haven't seen any partition leadership changes to proactively discover any new brokers or partitions
			metadataMaxAge: 300000,
			// The maximum amount of data per-partition the server will return. This size must be at least as large as the maximum message size the server allows or else it is possible for the producer to send messages larger than the consumer can fetch. If that happens, the consumer can get stuck trying to fetch a large message on a certain partition (default 1mb).
			maxBytesPerPartition: 1048576, // 1(mb)
			// Minimum amount of data the server should return for a fetch request, otherwise wait up to maxWaitTimeInMs for more data to accumulate.
			minBytes: 1,
			// Maximum amount of bytes to accumulate in the response. Supported by Kafka >= 0.10.1.0 (Default 10mb).
			maxBytes: 10485760,
			// The maximum amount of time in milliseconds the server will block before answering the fetch request if there isn’t sufficient data to immediately satisfy the requirement given by minBytes
			maxWaitTimeInMs: 5000,
		},
		producer: {
			// Default producer topic
			topic: '',
			// Control the number of required acks.
			// -1 = all replicas must acknowledge (default)
			// 0 = no acknowledgments
			// 1 = only waits for the leader to acknowledge
			acks: -1,
			// The time to await a response in ms (default is 30000)
			timeout: 10000,
		},
	},
	database: {
		mysql: {
			config: {
				user: 'metamorphosis',
				password: '',
				host: 'localhost',
				port: 13306,
				database: 'metamorphosis_test',
				waitForConnections: true,
				connectionLimit: 10,
				queueLimit: 0,
			},
		},
	},
	server: {
		log: false,
		port: 3000,
		address: '0.0.0.0',
		opts: {},
	},
};
