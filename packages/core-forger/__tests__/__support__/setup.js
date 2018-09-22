'use strict'

const path = require('path')
const container = require('@arkecosystem/core-container')

exports.setUp = async () => {
  await container.setUp({
    data: '~/.ark',
    config: path.resolve(__dirname, '../../../core/lib/config/testnet'),
    token: 'ark',
    network: 'testnet'
  }, {
    exit: '@arkecosystem/core-logger-winston'
  })
}

exports.tearDown = async () => {
  await container.tearDown()
}
