'use strict';
const net = require('net');

module.exports = (port, options) => {
	options = Object.assign({timeout: 1000}, options);

	return new Promise((resolve => {
		const socket = new net.Socket();

		const onError = () => {
			socket.destroy();
			resolve(false);
		};

		socket.setTimeout(options.timeout);
		socket.once('error', onError);
		socket.once('timeout', onError);

		socket.connect(port, options.host, () => {
			socket.end();
			resolve(true);
		});
	}));
};
