'use strict';

import deepmerge from 'deepmerge';

const numTestMessages = 1000;

const globalTestConfig = {
	kafka: {
		config: {
			brokers: 'localhost:9092',
			clientId: 'metamorphosis-test-client',
		},
	},
};

const simpleConsumerConfig = deepmerge(globalTestConfig, {
	kafka: {
		consumer: {
			topic: 'metamorphosis-test-simple',
			groupId: `simple-consumer-${Date.now()}`,
		},
		producer: {
			topic: 'metamorphosis-test-simple',
		},
	},
});

const mysqlConsumerConfig = deepmerge(globalTestConfig, {
	kafka: {
		consumer: {
			topic: 'metamorphosis-test-mysql',
			groupId: `mysql-consumer-${Date.now()}`,
		},
		producer: {
			topic: 'metamorphosis-test-mysql',
		},
	},
});

module.exports = {
	simpleConsumerConfig,
	mysqlConsumerConfig,
	numTestMessages,
};
