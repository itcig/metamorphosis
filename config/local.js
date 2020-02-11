/**
 * This config overrides any defaults. Specify any values here that you want to hardcode
 * for this application or required ENV variables that will be merged.
 *
 * There is no way to check these values are ENV placeholders so if you set something here
 * and there is no corresponded ENV value, the placeholder will still be used over
 * anything in default config.
 */
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
	server: {
		log: 'SERVER_LOGGING',
		port: 'SERVER_PORT',
		address: 'SERVER_HOST',
		opts: {},
	},
};
