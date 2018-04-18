'use strict';

const between = require('./between')

module.exports = (input, min, max) => (!between(input, min, max))
