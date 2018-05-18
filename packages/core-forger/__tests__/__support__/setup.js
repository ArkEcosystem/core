'use strict'

const path = require('path')
const container = require('@arkecosystem/core-container')

exports.setUp = async () => {
  await container.start({
    data: '~/.ark',
    config: path.resolve(__dirname, '../../../core-config/lib/networks/testnet'),
    token: 'ark',
    network: 'testnet'
  }, {
    exit: '@arkecosystem/core-blockchain'
  })
}

exports.tearDown = async () => container.tearDown()
