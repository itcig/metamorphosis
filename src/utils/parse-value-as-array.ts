/**
 * Similar to parseEnvValue except decidely converts all comma-delimited strings to arrays
 *
 * @param value
 */
const parseValueAsArray = (value: string | any[]): any => {
	// Return if undefined
	if (!value === undefined) {
		return;
	}

	// Already an array
	if (Array.isArray(value)) {
		return value;
	}

	// Boolean
	if (value.toString().toLowerCase() === 'true' || value.toString().toLowerCase() === 'false') {
		return value.toString().toLowerCase() === 'true';
	}

	// Number
	if (!isNaN(Number(value))) {
		return Number(value);
	}

	// Comma-separated string
	if (value.indexOf(',') !== -1) {
		return value.split(',').map(parseValueAsArray);
	}

	return value;
};

export default parseValueAsArray;
