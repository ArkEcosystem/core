'use strict'

const path = require('path')
const container = require('@arkecosystem/core-container')

jest.setTimeout(60000)

exports.setUp = async () => {
  await container.start({
    data: '~/.ark',
    config: path.resolve(__dirname, './config')
  }, {
    exit: '@arkecosystem/core-blockchain'
  })
}

exports.tearDown = async () => container.tearDown()
