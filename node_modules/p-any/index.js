'use strict';
const pSome = require('p-some');
const PCancelable = require('p-cancelable');

const pAny = (iterable, options) => {
	const anyCancelable = pSome(iterable, {...options, count: 1});

	return PCancelable.fn(async onCancel => {
		onCancel(() => {
			anyCancelable.cancel();
		});

		const [value] = await anyCancelable;
		return value;
	})();
};

module.exports = pAny;
// TODO: Remove this for the next major release
module.exports.default = pAny;

module.exports.AggregateError = pSome.AggregateError;
