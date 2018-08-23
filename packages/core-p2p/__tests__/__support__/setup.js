<<<<<<< HEAD
const app = require('@phantomchain/core-container')
const appHelper = require('@phantomchain/core-test-utils/lib/helpers/container')
=======
'use strict'

const path = require('path')
const container = require('@phantomcore/core-container')
>>>>>>> renaming

jest.setTimeout(60000)

exports.setUp = async () => {
<<<<<<< HEAD
  await appHelper.setUp({
    exit: '@phantomchain/core-blockchain',
=======
  await container.setUp({
    data: '~/.phantom',
    config: path.resolve(__dirname, './config')
  }, {
    exit: '@phantomcore/core-blockchain'
>>>>>>> renaming
  })
}

exports.tearDown = async () => {
  await app.tearDown()
}
