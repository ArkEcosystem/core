'use strict'

const sumBy = require('lodash/sumBy')
const { bignumify, delegateCalculator } = require('@arkecosystem/core-utils')
const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const blockchain = container.resolvePlugin('blockchain')
const database = container.resolvePlugin('database')

const renderDelegates = (delegates, contents) => {
  delegates.forEach(delegate => {
    const voters = database.walletManager
      .allByPublicKey()
      .filter(wallet => wallet.vote === delegate.publicKey)

    const approval = delegateCalculator.calculateApproval(delegate).toString()
    const rank = delegate.rate.toLocaleString(undefined, { minimumIntegerDigits: 2 })
    const votes = (delegate.voteBalance.toFixed() / 1e8).toLocaleString(undefined, { maximumFractionDigits: 0 })

    contents += `|  ${rank}  | ${delegate.username.padEnd(25)} |  ${approval.padEnd(4)}  | ${votes.padEnd(10)} |  ${voters.length.toString().padEnd(4)}  |`
    contents += '\r\n'
  })

  return contents
}

module.exports = () => {
  const lastBlock = blockchain.getLastBlock()
  const constants = config.getConstants(lastBlock.data.height)
  const rewards = bignumify(constants.reward).times(lastBlock.data.height - constants.height)
  const supply = +bignumify(config.genesisBlock.totalAmount).plus(rewards).toFixed()

  const active = database.walletManager
    .allByUsername()
    .sort((a, b) => a.rate - b.rate)
    .slice(0, constants.activeDelegates)

  const standby = database.walletManager
    .allByUsername()
    .sort((a, b) => a.rate - b.rate)
    .slice(constants.activeDelegates + 1, constants.activeDelegates + 30)

  const voters = database.walletManager
    .allByPublicKey()
    .filter(wallet => wallet.vote)

  const totalVotes = sumBy(voters, o => +o.balance.toFixed())
  const percentage = (totalVotes * 100) / supply

  let contents = `Top ${constants.activeDelegates} Delegates Stats`
  contents += '\r\n\r\n'
  contents += `=> Total Votes  : ${percentage.toLocaleString(undefined, { maximumFractionDigits: 2 })}% (${(totalVotes / 1e8).toLocaleString(undefined, { maximumFractionDigits: 0 })} / ${(supply / 1e8).toLocaleString(undefined, { maximumFractionDigits: 0 })})`
  contents += '\r\n'
  contents += `=> Total Voters : ${voters.length}`
  contents += '\r\n\r\n'
  contents += '===================================================================\r\n'
  contents += '| Rank | Delegate                  | Vote % |  Vote ARK  | Voters |'
  contents += '\r\n'
  contents += '===================================================================\r\n'
  contents = renderDelegates(active, contents)
  contents += '===================================================================\r\n'

  if (standby) {
    contents = renderDelegates(standby, contents)
    contents += '===================================================================\r\n'
  }

  return contents
}
