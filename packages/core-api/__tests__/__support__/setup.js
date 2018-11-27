const app = require('@arkecosystem/core-container')
const appHelper = require('@arkecosystem/core-test-utils/lib/helpers/container')

const activeDelegates = require('@arkecosystem/core-test-utils/fixtures/testnet/delegates')
const generateRound = require('./utils/generate-round')

const round = generateRound(
  activeDelegates.map(delegate => delegate.publicKey),
  1,
)

exports.setUp = async () => {
  jest.setTimeout(60000)

  await appHelper.setUp({})

  const connection = app.resolvePlugin('database')
  await connection.db.rounds.truncate()
  await connection.buildWallets(1)
  await connection.saveWallets(true)
  await connection.saveRound(round)
}

exports.tearDown = async () => {
  await app.tearDown()
}
