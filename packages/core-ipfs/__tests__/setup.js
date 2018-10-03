'use strict'

const path = require('path')
const container = require('@arkecosystem/core-container')

jest.setTimeout(60000)

exports.setUp = async () => {
  await container.setUp({
    data: '~/.ark',
    config: path.resolve(__dirname, './config'),
    network: 'testnet',
    token: 'ark'
  }, {
  })

  return container
}

exports.tearDown = async () => {
  await container.tearDown()
}
