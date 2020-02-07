export default (str: string): object | string => {
	try {
		return JSON.parse(str);
	} catch (e) {
		return str;
	}
};
