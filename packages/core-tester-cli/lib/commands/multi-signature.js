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

  let transactions = []
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

  if (copyTransactions) {
    utils.copyToClipboard(transactions)
    process.exit() // eslint-disable-line no-unreachable
  }

  try {
    await utils.request.post('/peer/transactions', {transactions}, true)
    const delaySeconds = await utils.getTransactionDelay(transactions)
    logger.info(`Waiting ${delaySeconds} seconds to apply multi-signature transactions`)
    await delay(delaySeconds * 1000)
  } catch (error) {
    logger.error(`There was a problem sending multi-signature transactions: ${error.response.data.message}`)
    process.exit(1)
  }

  await __testSendWithSignatures(multiSignatureWallets, approvalWallets)
  await __testSendWithMinSignatures(multiSignatureWallets, approvalWallets, min)
  await __testSendWithBelowMinSignatures(multiSignatureWallets, approvalWallets, min)
  await __testSendWithoutSignatures(multiSignatureWallets)
  await __testSendWithEmptySignatures(multiSignatureWallets)
  await __testNewMultiSignatureRegistration(multiSignatureWallets, options)
}

/**
 * Send transactions with approver signatures.
 * @return {void}
 */
async function __testSendWithSignatures (multiSignatureWallets, approvalWallets) {
  logger.info('Sending transactions with signatures')

  const transactions = []
  multiSignatureWallets.forEach((wallet, i) => {
    const transaction = ark.transaction.createTransaction(
      wallet.address,
      2,
      `TID - with sigs: ${i}`,
      wallet.passphrase
    )
    transaction.signatures = []
    for (let j = approvalWallets.length - 1; j >= 0; j--) {
      const approverSignature = ark.multisignature.signTransaction(
        transaction,
        approvalWallets[j].passphrase
      )
      transaction.signatures.push(approverSignature)
    }
    transactions.push(transaction)

    logger.info(`${i} ==> ${transaction.id}, ${wallet.address}`)
  })

  try {
    await utils.request.post('/peer/transactions', {transactions}, true)
    const delaySeconds = await utils.getTransactionDelay(transactions)
    logger.info(`Waiting ${delaySeconds} seconds to apply transactions`)
    await delay(delaySeconds * 1000)

    for (let i = 0; i < transactions.length; i++) {
      const tx = await utils.getTransaction(transactions[i].id)
      if (!tx) {
        logger.error(`Transaction '${transactions[i].id}' is be on the blockchain`)
      }
    }
  } catch (error) {
    logger.error(`There was a problem sending transactions: ${error.response.data.message}`)
    process.exit(1)
  }
}

/**
 * Send transactions with min approver signatures.
 * @return {void}
 */
async function __testSendWithMinSignatures (multiSignatureWallets, approvalWallets, min) {
  logger.info(`Sending transactions with ${min} (min) of ${approvalWallets.length} signatures`)

  const transactions = []
  multiSignatureWallets.forEach((wallet, i) => {
    const transaction = ark.transaction.createTransaction(
      wallet.address,
      2,
      `TID - with ${min} sigs: ${i}`,
      wallet.passphrase
    )
    transaction.signatures = []
    for (let j = approvalWallets.length - 1; j >= 0; j--) {
      const approverSignature = ark.multisignature.signTransaction(
        transaction,
        approvalWallets[j].passphrase
      )
      transaction.signatures.push(approverSignature)
      if (transaction.signatures.length === min) {
        break
      }
    }
    transactions.push(transaction)

    logger.info(`${i} ==> ${transaction.id}, ${wallet.address}`)
  })

  try {
    await utils.request.post('/peer/transactions', {transactions}, true)
    const delaySeconds = await utils.getTransactionDelay(transactions)
    logger.info(`Waiting ${delaySeconds} seconds to apply transactions`)
    await delay(delaySeconds * 1000)

    for (let i = 0; i < transactions.length; i++) {
      const tx = await utils.getTransaction(transactions[i].id)
      if (!tx) {
        logger.error(`Transaction '${transactions[i].id}' should be on the blockchain`)
      }
    }
  } catch (error) {
    logger.error(`There was a problem sending transactions: ${error.response.data.message}`)
    process.exit(1)
  }
}

/**
 * Send transactions with below min approver signatures.
 * @return {void}
 */
async function __testSendWithBelowMinSignatures (multiSignatureWallets, approvalWallets, min) {
  const max = min - 1
  logger.info(`Sending transactions with ${max} (below min) of ${approvalWallets.length} signatures`)

  const transactions = []
  multiSignatureWallets.forEach((wallet, i) => {
    const transaction = ark.transaction.createTransaction(
      wallet.address,
      2,
      `TID - with ${max} sigs: ${i}`,
      wallet.passphrase
    )
    transaction.signatures = []
    for (let j = approvalWallets.length - 1; j >= 0; j--) {
      const approverSignature = ark.multisignature.signTransaction(
        transaction,
        approvalWallets[j].passphrase
      )
      transaction.signatures.push(approverSignature)
      if (transaction.signatures.length === max) {
        break
      }
    }
    transactions.push(transaction)

    logger.info(`${i} ==> ${transaction.id}, ${wallet.address}`)
  })

  try {
    await utils.request.post('/peer/transactions', {transactions}, true)
    const delaySeconds = await utils.getTransactionDelay(transactions)
    logger.info(`Waiting ${delaySeconds} seconds to apply transactions`)
    await delay(delaySeconds * 1000)

    for (let i = 0; i < transactions.length; i++) {
      const tx = await utils.getTransaction(transactions[i].id)
      if (tx) {
        logger.error(`Transaction '${transactions[i].id}' should not be on the blockchain`)
      }
    }
  } catch (error) {
    logger.error(`There was a problem sending transactions: ${error.response.data.message}`)
    process.exit(1)
  }
}

/**
 * Send transactions without approver signatures.
 * @return {void}
 */
async function __testSendWithoutSignatures (multiSignatureWallets) {
  logger.info('Sending transactions without signatures')

  const transactions = []
  multiSignatureWallets.forEach((wallet, i) => {
    const transaction = ark.transaction.createTransaction(
      wallet.address,
      2,
      `TID - without sigs: ${i}`,
      wallet.passphrase
    )
    transactions.push(transaction)

    logger.info(`${i} ==> ${transaction.id}, ${wallet.address}`)
  })

  try {
    await utils.request.post('/peer/transactions', {transactions}, true)
    const delaySeconds = await utils.getTransactionDelay(transactions)
    logger.info(`Waiting ${delaySeconds} seconds to apply transactions`)
    await delay(delaySeconds * 1000)

    for (let i = 0; i < transactions.length; i++) {
      const tx = await utils.getTransaction(transactions[i].id)
      if (tx) {
        logger.error(`Transaction '${transactions[i].id}' should not on the blockchain`)
      }
    }
  } catch (error) {
    logger.error(`There was a problem sending transactions: ${error.response.data.message}`)
    process.exit(1)
  }
}

/**
 * Send transactions with empty approver signatures.
 * @return {void}
 */
async function __testSendWithEmptySignatures (multiSignatureWallets) {
  logger.info('Sending transactions with empty signatures')

  const transactions = []
  multiSignatureWallets.forEach((wallet, i) => {
    const transaction = ark.transaction.createTransaction(
      wallet.address,
      2,
      `TID - without sigs: ${i}`,
      wallet.passphrase
    )
    transaction.signatures = []
    transactions.push(transaction)

    logger.info(`${i} ==> ${transaction.id}, ${wallet.address}`)
  })

  try {
    await utils.request.post('/peer/transactions', {transactions}, true)
    const delaySeconds = await utils.getTransactionDelay(transactions)
    logger.info(`Waiting ${delaySeconds} seconds to apply transactions`)
    await delay(delaySeconds * 1000)

    for (let i = 0; i < transactions.length; i++) {
      const tx = await utils.getTransaction(transactions[i].id)
      if (tx) {
        logger.error(`Transaction '${transactions[i].id}' should not on the blockchain`)
      }
    }
  } catch (error) {
    logger.error(`There was a problem sending transactions: ${error.response.data.message}`)
    process.exit(1)
  }
}

/**
 * Send transactions to re-register multi-signature wallets.
 * @return {void}
 */
async function __testNewMultiSignatureRegistration (multiSignatureWallets, options) {
  logger.info('Sending transactions to re-register multi-signature')

  const transactions = []
  const approvalWallets = utils.generateWallets(options.quantity)
  const publicKeys = approvalWallets.map(wallet => `+${wallet.keys.publicKey}`)
  const min = options.min ? Math.min(options.min, publicKeys.length) : publicKeys.length

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

  try {
    await utils.request.post('/peer/transactions', {transactions}, true)
    const delaySeconds = await utils.getTransactionDelay(transactions)
    logger.info(`Waiting ${delaySeconds} seconds to apply transactions`)
    await delay(delaySeconds * 1000)

    for (let i = 0; i < transactions.length; i++) {
      const tx = await utils.getTransaction(transactions[i].id)
      if (tx) {
        logger.error(`Transaction '${transactions[i].id}' should not on the blockchain`)
      }
    }
  } catch (error) {
    logger.error(`There was a problem sending transactions: ${error.response.data.message}`)
    process.exit(1)
  }
}
