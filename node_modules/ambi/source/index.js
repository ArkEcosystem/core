'use strict'

// Import
const typeChecker = require('typechecker')

// Handle success case
function onSuccess(value) {
	// Reject if an error was returned
	if (typeChecker.isError(value)) return Promise.reject(value)
	// Success case, so return the value
	return value
}

/**
 * Ambidextrously execute the method with the passed arguments.
 * If method.length > args.length, then ambi provides the method with a completion callback as the last expected argument.
 * @param {function} method A method, that can either resolve synchronously, via a promise, or via a callback.
 * @param {*} args
 * @returns {Promise<*>} The determined result.
 */
function ambi(method, ...args) {
	/*
	Different ways functions can be called:
	ambi(function(a,next){next(null, a)}, a)
		> method.length > args.length
		> next will be provided automatically
	ambi(function(a){return a}, a)
		> method.length = args.length
		> no argument changes by ambi
	ambi(function(a){return a}, a, b)
		> method.length < args.length
		> no argument changes by ambi
	*/
	try {
		// Inject a completion callback
		if (method.length > args.length) {
			return new Promise(function(resolve, reject) {
				const xargs = args
					.slice()
					// add the difference as undefined values
					.concat(new Array(method.length - args.length - 1))
					// add the completion callback
					.concat([
						function ambiCallback(err, ...args) {
							if (err) return reject(err)
							if (args.length === 1) return resolve(args[0])
							return resolve(args)
						}
					])
				method(...xargs)
			}).then(onSuccess)
		}
		// Execute without a completion callback
		else {
			return Promise.resolve(method(...args)).then(onSuccess)
		}
	} catch (err) {
		return Promise.reject(err)
	}
}

// Export
module.exports = ambi
