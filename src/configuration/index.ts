/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Application } from '../types/types';
import Debug from 'debug';
import path from 'path';
import config from 'config';
import * as DotEnv from 'dotenv';
import parseEnvValue from '../utils/parse-env-value';

// Load config from dotenv
DotEnv.config();

// Enable debug module for string loaded in .env
Debug.enable(process.env.DEBUG || '');

const debug = Debug('metamorphosis:config');

// Enable debug for entire `metamorphosis` namespace if `DEBUG` env is true
// if (envVars.DEBUG === 'true') {
// 	Debug.enable('metamorphosis:app');
// }

export default function init(): (
	app?: Application<{}>
) => {
	[key: string]: any;
};

export default function init() {
	return (app?: Application) => {
		const convert = (current: any): any => {
			const result: { [key: string]: any } = Array.isArray(current) ? [] : {};

			Object.keys(current).forEach(name => {
				let value = current[name];

				if (typeof value === 'object' && value !== null) {
					value = convert(value);
				}

				if (typeof value === 'string') {
					if (value.indexOf('\\') === 0) {
						value = value.replace('\\', '');
					} else {
						if (process.env[value]) {
							value = process.env[value];
						}
						if (value.indexOf('.') === 0 || value.indexOf('..') === 0) {
							// Make relative paths absolute
							value = path.resolve(path.join(config.util.getEnv('NODE_CONFIG_DIR')), value.replace(/\//g, path.sep));
						}
					}
				}

				// Try to parse ENV strings as booleans and numbers where possible
				value = value && parseEnvValue(value);

				result[name] = value;
			});

			return result;
		};

		const env = config.util.getEnv('NODE_ENV');
		const conf = convert(config);

		if (!app) {
			return conf;
		}

		debug(`Initializing configuration for ${env} environment`);

		Object.keys(conf).forEach(name => {
			const value = conf[name];
			debug(`Setting '${name}' configuration value to`, value);
			app && app.set(name, value);
		});

		return conf;
	};
}
