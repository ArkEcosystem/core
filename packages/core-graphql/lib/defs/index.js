'use strict';

const inputs = require('./inputs')
const types = require('./types')
const root = require('./root')

module.exports = `
  ${inputs}
  ${root}
  ${types}
`
