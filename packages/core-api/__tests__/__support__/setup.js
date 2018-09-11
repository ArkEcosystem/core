'use strict'

const path = require('path')
const container = require('@arkecosystem/core-container')

const generateRound = require('./utils/generate-round')
const activeDelegates = require('../__fixtures__/delegates.json')
const round = generateRound(activeDelegates, 1)

exports.setUp = async (options = {
    exclude: [ '@arkecosystem/core-forger' ]
  }) => {
  jest.setTimeout(60000)

  process.env.ARK_SKIP_BLOCKCHAIN_STARTED_CHECK = true

  await container.setUp({
    data: '~/.ark',
    config: path.resolve(__dirname, './config')
  }, options)

  const connection = container.resolvePlugin('database')
  await connection.db.rounds.truncate()
  await connection.buildWallets(1)
  await connection.saveWallets(true)
  await connection.saveRound(round)
}

exports.tearDown = async () => {
  await container.tearDown()
}
