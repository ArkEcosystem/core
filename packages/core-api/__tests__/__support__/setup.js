'use strict'

const path = require('path')
const container = require('@arkecosystem/core-container')

const generateRound = require('./utils/generate-round')
const activeDelegates = require('../__fixtures__/delegates.json')
const round = generateRound(activeDelegates, 1)

exports.setUp = async () => {
  jest.setTimeout(60000)

  process.env.ARK_SKIP_BLOCKCHAIN_STARTED_CHECK = true

  await container.setUp({
    data: '~/.ark',
    config: path.resolve(__dirname, './config')
  }, {
    exit: '@arkecosystem/core-api'
  })

  // seed
  const connection = container.resolvePlugin('database')
  await connection.buildWallets(1)
  await connection.saveWallets(true)
  await connection.saveRound(round)
}

exports.tearDown = async () => {
  await container.tearDown()
}
