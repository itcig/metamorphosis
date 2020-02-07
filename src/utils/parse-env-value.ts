const parseEnvValue = (value: string): any => {
	// Return if undefined
	if (!value === undefined) {
		return;
	}

	// Boolean
	if (value.toString().toLowerCase() === 'true' || value.toString().toLowerCase() === 'false') {
		return value.toString().toLowerCase() === 'true';
	}

	// Number
	if (!isNaN(Number(value))) {
		return Number(value);
	}

	// Array
	// This is too opinionated
	// if (value.indexOf(',') !== -1) {
	// 	return value.split(',').map(parseEnvValue);
	// }

	return value;
};

export default parseEnvValue;
