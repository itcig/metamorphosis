module.exports = {
	kafka: {
		config: {
			brokers: 'KAFKA_BROKERS',
			clientId: 'KAFKA_CLIENT_ID',
		},
		consumer: {
			// Default consumer topic
			topic: 'KAFKA_TOPIC_CONSUMER',
			// Consumer group Kafka will track current offset for
			groupId: 'CONSUMER_GROUP_ID',
			// Timeout in milliseconds used to detect failures. The consumer sends periodic heartbeats to indicate its liveness to the broker. If no heartbeats are received by the broker before the expiration of this session timeout, then the broker will remove this consumer from the group and initiate a rebalance
			sessionTimeout: 'CONSUMER_SESSION_TIMEOUT_MS',
			// The maximum time that the coordinator will wait for each member to rejoin when rebalancing the group
			rebalanceTimeout: 'CONSUMER_REBALANCE_TIMEOUT_MS',
			// The expected time in milliseconds between heartbeats to the consumer coordinator. Heartbeats are used to ensure that the consumer's session stays active. The value must be set lower than session timeout
			heartbeatInterval: 'CONSUMER_HEARTBEAT_INTERVAL_MS',
			// The period of time in milliseconds after which we force a refresh of metadata even if we haven't seen any partition leadership changes to proactively discover any new brokers or partitions
			metadataMaxAge: 'CONSUMER_METADATA_MAX_AGE_MS',
			// The maximum amount of data per-partition the server will return. This size must be at least as large as the maximum message size the server allows or else it is possible for the producer to send messages larger than the consumer can fetch. If that happens, the consumer can get stuck trying to fetch a large message on a certain partition (default 1mb).
			maxBytesPerPartition: 'CONSUMER_MAX_BYTES_PER_PARTITION', // 1(mb)
			// Minimum amount of data the server should return for a fetch request, otherwise wait up to maxWaitTimeInMs for more data to accumulate.
			minBytes: 'CONSUMER_MIN_BYTES',
			// Maximum amount of bytes to accumulate in the response. Supported by Kafka >= 0.10.1.0 (Default 10mb).
			maxBytes: 'CONSUMER_MAX_BYTES',
			// The maximum amount of time in milliseconds the server will block before answering the fetch request if there isn’t sufficient data to immediately satisfy the requirement given by minBytes
			maxWaitTimeInMs: 'CONSUMER_MAX_WAIT_TIME_MS',
		},
		producer: {
			// Default producer topic
			topic: 'KAFKA_TOPIC_PRODUCER',
		},
	},
	database: {
		mysql: {
			config: {
				user: 'MYSQL_USER',
				password: 'MYSQL_PASSWORD',
				host: 'MYSQL_HOST',
				port: 'MYSQL_PORT',
				database: 'MYSQL_DATABASE',
				waitForConnections: 'MYSQL_POOL_WAIT_FOR_CONNECTION',
				connectionLimit: 'MYSQL_POOL_CONNECTION_LIMIT',
				queueLimit: 'MYSQL_POOL_QUEUE_LIMIT',
			},
		},
	},
	webhooks: {
		log: WEBHOOK_LOGGING,
	},
};
