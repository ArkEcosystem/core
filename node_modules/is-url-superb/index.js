'use strict';
const urlRegex = require('url-regex')({exact: true});

module.exports = url => {
	if (typeof url !== 'string') {
		throw new TypeError('Expected a string');
	}

	return urlRegex.test(url.trim());
};
