'use strict'

const ark = require('arkjs')
const delay = require('delay')
const utils = require('../utils')
const logger = utils.logger
const transactionCommand = require('./transactions')

module.exports = async (options) => {
  const wallets = utils.generateWallets(options.number)
  await transactionCommand(options, wallets, 2, true)

  let delegateVotes = []
  if (!options.delegate) {
    const delegates = await utils.getDelegates()
    for (let i = 0; i < options.quantity; i++) {
      const randomKey = Math.floor(Math.random() * delegates.length)
      const randomDelegate = delegates.slice(randomKey, randomKey + 1).pop()
      delegateVotes.push({
        delegate: randomDelegate,
        voters: await utils.getVoters(randomDelegate.publicKey)
      })
    }
  }

  let voters = 0
  delegateVotes.forEach(detail => {
    voters += detail.voters.length
  })

  logger.info(`Delegate starting voters: ${voters}`)

  const transactions = []
  wallets.forEach((wallet, i) => {
    const transaction = ark.vote.createVote(
      wallet.passphrase,
      delegateVotes.map(detail => `+${detail.delegate.publicKey}`)
    )
    transactions.push(transaction)

    logger.info(`${i} ==> ${transaction.id}, ${wallet.address}`)
  })

  if (options.copy) {
    utils.copyToClipboard(transactions)
    process.exit() // eslint-disable-line no-unreachable
  }

  const expectedVoters = voters + (wallets.length * options.quantity)
  logger.info(`Expected end voters: ${expectedVoters}`)

  try {
    await utils.request.post('/peer/transactions', {transactions}, true)

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
    logger.error(`There was a problem sending transactions: ${error.response.data.message}`)
  }
}
