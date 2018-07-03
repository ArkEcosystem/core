'use strict'

const ark = require('arkjs')
const delay = require('delay')
const sampleSize = require('lodash.samplesize')
const utils = require('../utils')
const config = require('../config')
const logger = utils.logger
const transferCommand = require('./transfer')

module.exports = async (options) => {
  utils.applyConfigOptions(options)

  const wallets = utils.generateWallets(options.number)
  await transferCommand(options, wallets, 2, true)

  let delegateVotes = []
  if (!options.delegate) {
    const delegates = await utils.getDelegates()
    const chosen = sampleSize(delegates, options.quantity)

    for (let i = 0; i < chosen.length; i++) {
      delegateVotes.push({
        delegate: chosen[i],
        voters: await utils.getVoters(chosen[i].publicKey)
      })
    }
  }

  let voters = 0
  delegateVotes.forEach(detail => {
    voters += detail.voters.length
  })

  logger.info(`Sending ${options.number} vote transactions`)
  if (!options.skipValidation) {
    logger.info(`Delegate starting voters: ${voters}`)
  }

  const transactions = []
  wallets.forEach((wallet, i) => {
    const transaction = ark.vote.createVote(
      wallet.passphrase,
      delegateVotes.map(detail => `+${detail.delegate.publicKey}`),
      config.secondPassphrase,
      utils.parseFee(options.voteFee)
    )

    transactions.push(transaction)

    logger.info(`${i} ==> ${transaction.id}, ${wallet.address} (fee: ${transaction.fee})`)
  })

  if (options.copy) {
    utils.copyToClipboard(transactions)
    process.exit() // eslint-disable-line no-unreachable
  }

  const expectedVoters = voters + wallets.length
  if (!options.skipValidation) {
    logger.info(`Expected end voters: ${expectedVoters}`)
  }

  try {
    await utils.request.post('/peer/transactions', {transactions}, true)

    if (options.skipValidation) {
      return
    }

    const delaySeconds = await utils.getTransactionDelay(transactions)
    logger.info(`Waiting ${delaySeconds} seconds to apply vote transactions`)
    await delay(delaySeconds * 1000)

    let voters = 0
    for (const detail of delegateVotes) {
      voters += (await utils.getVoters(detail.delegate.publicKey)).length
    }

    logger.info(`All transactions have been sent! Total voters: ${voters}`)

    if (voters !== expectedVoters) {
      logger.error(`Delegate voter count incorrect. '${voters}' but should be '${expectedVoters}'`)
    }
  } catch (error) {
    logger.error(`There was a problem sending transactions: ${error.response ? error.response.data.message : error}`)
  }
}
