const isRegExp = (string: string): boolean => {
	try {
		return new Function(`
            "use strict";
            try {
                new RegExp(${string});
                return true;
            } catch (e) {
                return false;
            }
        `)();
	} catch (e) {
		return false;
	}
};

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

	// Regex
	if (isRegExp(value)) {
		const parts = value.split('/');
		if (value[0] === '/' && parts.length >= 3) {
			const option = parts[parts.length - 1];
			const lastIndex = value.lastIndexOf('/');
			const regex = value.substring(1, lastIndex);
			return new RegExp(regex, option);
		}
	}

	// Array
	// This is too opinionated
	// if (value.indexOf(',') !== -1) {
	// 	return value.split(',').map(parseEnvValue);
	// }

	return value;
};

export default parseEnvValue;
