'use strict'

const path = require('path')
const container = require('@arkecosystem/core-container')

jest.setTimeout(60000)

exports.setUp = async () => {
  await container.setUp({
    data: '~/.ark',
    config: path.resolve(__dirname, '../../../core/lib/config/testnet'),
    token: 'ark',
    network: 'testnet'
  }, {
    exit: '@arkecosystem/core-p2p',
    exclude: ['@arkecosystem/core-blockchain']
  })

  return container
}

exports.tearDown = async () => container.tearDown()
