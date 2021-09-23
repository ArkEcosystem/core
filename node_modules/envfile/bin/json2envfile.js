#!/usr/bin/env node

/* eslint no-var:0, no-sync:0 */
'use strict'

var data = ''
process.stdin.on('readable', function () {
	var chunk = process.stdin.read()
	if (chunk)  data += chunk.toString()
})
process.stdin.on('end', function () {
	var result = require('../').stringifySync(JSON.parse(data))
	process.stdout.write(result)
})
