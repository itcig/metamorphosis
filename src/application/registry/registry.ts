import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import avro from 'avsc';
import deepmerge from 'deepmerge';

import longType from './types/long-type';
import { SchemaRegistryAPIClientArgs, SchemaRegistryAPIClientOptions } from '@kafkajs/confluent-schema-registry/dist/api';

export class KafkaSchemaRegistry extends SchemaRegistry {
	constructor(schemaRegistryClient: SchemaRegistryAPIClientArgs, options?: SchemaRegistryAPIClientOptions | undefined) {
		// // Merge any passed forSchemaOptions with custom registry for long Type.
		// // Without specifying long Type then any BigInts from a database would be truncated and throw a precision error
		// // https://github.com/kafkajs/confluent-schema-registry/issues/53
		super(
			schemaRegistryClient,
			deepmerge(options || {}, {
				registry: {
					long: longType,
				},
				typeHook: (schema: any, opts: avro.ForSchemaOptions): any => {
					let name = schema.name;
					if (!name) {
						return; // Not a named type, use default logic.
					}
					if (!~name.indexOf('.')) {
						// We need to qualify the type's name.
						const namespace = schema.namespace || opts.namespace;
						if (namespace) {
							name = `${namespace}.${name}`;
						}
					}
					// Return the type registered with the same name, if any.
					return opts.registry[name];
				},
			})
		);
	}
}
