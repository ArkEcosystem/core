/* eslint no-sync:0, no-unused-vars:0 */
'use strict'

// Requires
const ambi = require('ambi')
const eachr = require('eachr')
const typeChecker = require('typechecker')
const fs = require('fs')

/**
 * @callback ObjectErrback
 * @param {Error?} error An error if one occured.
 * @param {object} [result]
 * @returns {void}
 */

/**
 * @callback StringErrback
 * @param {Error?} error An error if one occured.
 * @param {string} [result]
 * @returns {void}
 */

/**
 * Parse an envfile string synchronously
 * @param {string} src
 * @returns {object}
 */
function parseSync(src) {
	// Try parse JSON
	try {
		return JSON.parse(src.toString())
	} catch (err) {
		// Try parse envfile string
		const result = {}
		const lines = src.toString().split('\n')
		for (const line of lines) {
			const match = line.match(/^([^=:#]+?)[=:](.*)/)
			if (match) {
				const key = match[1].trim()
				const value = match[2].trim()
				result[key] = value
			}
		}
		return result
	}
}

/**
 * Parse an envfile string
 * @param {string} src
 * @param {ObjectErrback} next
 * @returns {void}
 */
function parse(src, next) {
	// Call the synchronous method asynchronously and avoid zalgo by wrapping in nextTick
	process.nextTick(() => {
		ambi(parseSync, src, next)
	})
}

/**
 * Parse an env file asynchronously
 * @param {string} filePath
 * @param {ObjectErrback} next
 * @returns {void}
 */
function parseFile(filePath, next) {
	// Read
	fs.readFile(filePath, (err, data) => {
		// Check
		if (err) return next(err) // exit

		// Parse
		parse(data.toString(), next)
	})
}

/**
 * Parse an env file synchronously
 * @param {string} filePath
 * @returns {object}
 */
function parseFileSync(filePath) {
	// Read
	const data = fs.readFileSync(filePath)

	// Check the result
	if (typeChecker.isError(data)) {
		// An error occured
		return data
	} else {
		// Parse the result
		return parseSync(data.toString())
	}
}

/**
 * Turn an object into an envfile synchronously
 * @param {object} obj
 * @returns {string}
 */
function stringifySync(obj) {
	// Prepare
	let result = ''

	// Stringify
	eachr(obj, function(value, key) {
		if (key) {
			const line = `${key}=${String(value)}`
			result += line + '\n'
		}
	})

	// Return
	return result
}
/**
 * Turn an object into envfile string
 * @param {object} obj
 * @param {StringErrback} next
 * @returns {void}
 */
function stringify(obj, next) {
	// Call the synchronous method asynchronously and avoid zalgo by wrapping in nextTick
	process.nextTick(() => {
		ambi(stringifySync, obj, next)
	})
}

module.exports = {
	parseFile,
	parseFileSync,
	parse,
	parseSync,
	stringify,
	stringifySync
}
