module.exports = {
	kafka: {
		config: {
			brokers: 'KAFKA_BROKERS',
			clientId: 'KAFKA_CLIENT_ID',
		},
		consumer: {
			topic: 'KAFKA_TOPIC_CONSUMER',
			// Consumer group Kafka will track current offset for
			groupId: 'CONSUMER_GROUP_ID',
		},
		producer: {
			topic: 'KAFKA_TOPIC_PRODUCER',
		},
	},
	// database: {
	// 	mysql: {
	// 		config: {
	// 			user: 'MYSQL_USER',
	// 			password: 'MYSQL_PASSWORD',
	// 			host: 'MYSQL_HOST',
	// 			port: 'MYSQL_PORT',
	// 			database: 'MYSQL_DATABASE',
	// 			waitForConnections: 'MYSQL_POOL_WAIT_FOR_CONNECTION',
	// 			connectionLimit: 'MYSQL_POOL_CONNECTION_LIMIT',
	// 			queueLimit: 'MYSQL_POOL_QUEUE_LIMIT',
	// 		},
	// 	},
	// },
};
