'use strict';

module.exports = (input, pattern) => (new RegExp(pattern).test(input))
