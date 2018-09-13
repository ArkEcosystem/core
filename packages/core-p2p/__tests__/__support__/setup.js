'use strict'

const path = require('path')
const container = require('@arkecosystem/core-container')

jest.setTimeout(60000)

exports.setUp = async () => {
  process.env.ARK_DB_DATABASE = 'ark_testnet'

  await container.setUp({
    data: '~/.ark',
    config: path.resolve(__dirname, './config'),
    token: 'ark',
    network: 'testnet'
  }, {
    exit: '@arkecosystem/core-blockchain'
  })
}

exports.tearDown = async () => {
  await container.tearDown()
}
