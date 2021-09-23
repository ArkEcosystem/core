'use strict';
const AggregateError = require('aggregate-error');
const PCancelable = require('p-cancelable');

const pSome = (iterable, options) => new PCancelable((resolve, reject, onCancel) => {
	options = {
		filter: () => true,
		...options
	};

	if (!Number.isFinite(options.count)) {
		throw new TypeError(`Expected a finite number, got ${typeof options.count}`);
	}

	const values = [];
	const errors = [];
	let elementCount = 0;
	let maxErrors = -options.count + 1;
	let maxFiltered = -options.count + 1;
	let isDone = false;

	const completed = new Set();
	const cancelPendingIfDone = () => {
		if (!isDone) {
			return;
		}

		for (const promise of iterable) {
			if (!completed.has(promise) && typeof promise.cancel === 'function') {
				promise.cancel();
			}
		}
	};

	onCancel(() => {
		isDone = true;
		cancelPendingIfDone();
	});

	const fulfilled = value => {
		if (isDone) {
			return;
		}

		if (!options.filter(value)) {
			if (--maxFiltered === 0) {
				isDone = true;
				reject(new RangeError('Not enough values pass the `filter` option'));
			}

			return;
		}

		values.push(value);

		if (--options.count === 0) {
			isDone = true;
			resolve(values);
		}
	};

	const rejected = error => {
		if (isDone) {
			return;
		}

		errors.push(error);

		if (--maxErrors === 0) {
			isDone = true;
			reject(new AggregateError(errors));
		}
	};

	for (const element of iterable) {
		maxErrors++;
		maxFiltered++;
		elementCount++;

		(async () => {
			try {
				const value = await Promise.resolve(element);
				fulfilled(value);
			} catch (error) {
				rejected(error);
			}

			completed.add(element);
			cancelPendingIfDone();
		})();
	}

	if (options.count > elementCount) {
		throw new RangeError(`Expected input to contain at least ${options.count} items, but contains ${elementCount} items`);
	}
});

module.exports = pSome;
// TODO: Remove this for the next major release
module.exports.default = pSome;

module.exports.AggregateError = AggregateError;
