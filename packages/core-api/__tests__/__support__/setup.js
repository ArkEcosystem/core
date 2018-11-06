'use strict'

const container = require('@arkecosystem/core-container')
const containerHelper = require('@arkecosystem/core-test-utils/lib/helpers/container')

const generateRound = require('./utils/generate-round')
const activeDelegates = require('@arkecosystem/core-test-utils/fixtures/testnet/delegates')
const round = generateRound(activeDelegates.map(delegate => delegate.publicKey), 1)

exports.setUp = async () => {
  jest.setTimeout(60000)

  await containerHelper.setUp({})

  const connection = container.resolvePlugin('database')
  await connection.db.rounds.truncate()
  await connection.buildWallets(1)
  await connection.saveWallets(true)
  await connection.saveRound(round)
}

exports.tearDown = async () => {
  await container.tearDown()
}
