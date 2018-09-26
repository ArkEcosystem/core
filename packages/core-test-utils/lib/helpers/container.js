'use strict'

const path = require('path')
const container = require('@arkecosystem/core-container')

module.exports = {
  setUp: async (options) => container.setUp({
    data: '~/.ark',
    config: path.resolve(__dirname, '../../config/testnet'),
    token: 'ark',
    network: 'testnet'
  }, options)
}
