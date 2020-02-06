'use strict';

import deepmerge from 'deepmerge';

const globalTestConfig = {
	kafka: {
		config: {
			kafka: {
				brokers: 'localhost:9092',
				clientId: 'metamorphosis-test-client',
			},
		},
	},
};

const simpleConsumerConfig = deepmerge(globalTestConfig, {
	kafka: {
		topics: {
			consumer: 'metamorphosis-test-simple',
		},
		config: {
			consumer: {
				groupId: `simple-consumer-${Date.now()}`,
			},
		},
	},
});

const mysqlConsumerConfig = deepmerge(globalTestConfig, {
	kafka: {
		topics: {
			consumer: 'metamorphosis-test-mysql',
		},
		config: {
			consumer: {
				groupId: `simple-consumer-${Date.now()}`,
			},
		},
	},
});

module.exports = {
	simpleConsumerConfig,
	mysqlConsumerConfig,
};
