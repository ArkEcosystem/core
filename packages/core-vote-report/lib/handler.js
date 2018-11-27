const sumBy = require('lodash/sumBy')
const { configManager } = require('@arkecosystem/crypto')
const { bignumify, delegateCalculator } = require('@arkecosystem/core-utils')
const app = require('@arkecosystem/core-container')

const config = app.resolvePlugin('config')
const blockchain = app.resolvePlugin('blockchain')
const database = app.resolvePlugin('database')

const formatDelegates = delegates =>
  delegates.map(delegate => {
    const voters = database.walletManager
      .allByPublicKey()
      .filter(
        wallet =>
          wallet.vote === delegate.publicKey && wallet.balance > 0.1 * 1e8,
      )

    const approval = Number(
      delegateCalculator.calculateApproval(delegate),
    ).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    const rank = delegate.rate.toLocaleString(undefined, {
      minimumIntegerDigits: 2,
    })

    const votes = Number(delegate.voteBalance.div(1e8)).toLocaleString(
      undefined,
      { maximumFractionDigits: 0 },
    )
    const voterCount = voters.length.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })

    return {
      rank,
      username: delegate.username.padEnd(25),
      approval: approval.padEnd(4),
      votes: votes.padStart(10),
      voterCount: voterCount.padStart(5),
    }
  })

module.exports = (request, h) => {
  const lastBlock = blockchain.getLastBlock()
  const constants = config.getConstants(lastBlock.data.height)
  const delegateRows = app.resolveOptions('vote-report').delegateRows

  const rewards = bignumify(constants.reward).times(
    lastBlock.data.height - constants.height,
  )

  const supply = +bignumify(config.genesisBlock.totalAmount)
    .plus(rewards)
    .toFixed()

  const active = database.walletManager
    .allByUsername()
    .sort((a, b) => a.rate - b.rate)
    .slice(0, constants.activeDelegates)

  const standby = database.walletManager
    .allByUsername()
    .sort((a, b) => a.rate - b.rate)
    .slice(constants.activeDelegates + 1, delegateRows)

  const voters = database.walletManager
    .allByPublicKey()
    .filter(wallet => wallet.vote && wallet.balance > 0.1 * 1e8)

  const totalVotes = sumBy(voters, wallet => +wallet.balance.toFixed())
  const percentage = (totalVotes * 100) / supply

  const client = configManager.get('client')

  return h
    .view('index', {
      client,
      voteHeader: `Vote ${client.token}`.padStart(10),
      activeDelegatesCount: constants.activeDelegates,
      activeDelegates: formatDelegates(active),
      standbyDelegates: formatDelegates(standby),
      voters: voters.length.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      }),
      supply: (supply / 1e8).toLocaleString(undefined, {
        maximumFractionDigits: 0,
      }),
      totalVotes: (totalVotes / 1e8).toLocaleString(undefined, {
        maximumFractionDigits: 0,
      }),
      percentage: percentage.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    })
    .type('text/plain')
}
