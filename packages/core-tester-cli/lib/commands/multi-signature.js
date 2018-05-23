'use strict'

const ark = require('arkjs')
const delay = require('delay')
const utils = require('../utils')
const logger = utils.logger
const transactionCommand = require('./transactions')

module.exports = async (options) => {
  const copyTransactions = options.copy
  options.copy = false

  // Wallets for extra signatures
  const approvalWallets = utils.generateWallets(options.quantity)
  await transactionCommand(options, approvalWallets, 20, true)

  const publicKeys = approvalWallets.map(wallet => `+${wallet.keys.publicKey}`)

  const min = options.min ? Math.min(options.min, publicKeys.length) : publicKeys.length

  // Wallets with multi-signature
  const multiSignatureWallets = utils.generateWallets(options.number)
  await transactionCommand(options, multiSignatureWallets, (publicKeys.length * 5) + 10, true)

  const transactions = []
  multiSignatureWallets.forEach((wallet, i) => {
    const transaction = ark.multisignature.createMultisignature(
      wallet.passphrase,
      null,
      publicKeys,
      options.lifetime,
      min
    )
    transaction.signatures = []
    for (let i = approvalWallets.length - 1; i >= 0; i--) {
      const approverSignature = ark.multisignature.signTransaction(
        transaction,
        approvalWallets[i].passphrase
      )
      transaction.signatures.push(approverSignature)
    }
    transactions.push(transaction)

    logger.info(`${i} ==> ${transaction.id}, ${wallet.address}`)
  })

  console.log(transactions)

  if (copyTransactions) {
    utils.copyToClipboard(transactions)
    process.exit() // eslint-disable-line no-unreachable
  }

  try {
    await utils.request.post('/peer/transactions', {transactions}, true)

    const delaySeconds = await utils.getTransactionDelay(transactions)
    logger.info(`Waiting ${delaySeconds} seconds to apply multi-signature transactions`)
    await delay(delaySeconds * 1000)

    // let voters = 0
    // for (const detail of delegateVotes) {
    //   voters += (await utils.getVoters(detail.delegate.publicKey)).length
    // }
    // logger.info(`All transactions have been sent! Total voters: ${voters}`)

    // if (voters !== expectedVoters) {
    //   logger.error(`Delegate voter count incorrect. '${voters}' but should be '${expectedVoters}'`)
    // }
  } catch (error) {
    logger.error(`There was a problem sending transactions: ${error.response.data.message}`)
  }

  // let delegateVotes = []
  // if (!options.delegate) {
  //   const delegates = await utils.getDelegates()
  //   const chosen = sampleSize(delegates, options.quantity)

  //   for (let i = 0; i < chosen.length; i++) {
  //     delegateVotes.push({
  //       delegate: chosen[i],
  //       voters: await utils.getVoters(chosen[i].publicKey)
  //     })
  //   }
  // }

  // let voters = 0
  // delegateVotes.forEach(detail => {
  //   voters += detail.voters.length
  // })

  // logger.info(`Delegate starting voters: ${voters}`)

  // const transactions = []
  // wallets.forEach((wallet, i) => {
  //   const transaction = ark.vote.createVote(
  //     wallet.passphrase,
  //     delegateVotes.map(detail => `+${detail.delegate.publicKey}`)
  //   )
  //   transactions.push(transaction)

  //   logger.info(`${i} ==> ${transaction.id}, ${wallet.address}`)
  // })

  // if (options.copy) {
  //   utils.copyToClipboard(transactions)
  //   process.exit() // eslint-disable-line no-unreachable
  // }

  // const constants = await utils.getConstants()

  // const expectedVoters = (options.quantity > constants.activeVotes)
  //   ? voters + (wallets.length * constants.activeVotes)
  //   : voters + (wallets.length * options.quantity)

  // logger.info(`Expected end voters: ${expectedVoters}`)

  // try {
  //   await utils.request.post('/peer/transactions', {transactions}, true)

  //   const delaySeconds = await utils.getTransactionDelay(transactions)
  //   logger.info(`Waiting ${delaySeconds} seconds to apply vote transactions`)
  //   await delay(delaySeconds * 1000)

  //   let voters = 0
  //   for (const detail of delegateVotes) {
  //     voters += (await utils.getVoters(detail.delegate.publicKey)).length
  //   }
  //   logger.info(`All transactions have been sent! Total voters: ${voters}`)

  //   if (voters !== expectedVoters) {
  //     logger.error(`Delegate voter count incorrect. '${voters}' but should be '${expectedVoters}'`)
  //   }
  // } catch (error) {
  //   logger.error(`There was a problem sending transactions: ${error.response.data.message}`)
  // }
}
