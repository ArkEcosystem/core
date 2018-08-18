#!/usr/bin/env node

const Client = require('../lib/index')
const crypto = require('../../crypto/lib/index')

const sendGift = async () => {
  const version = 2
  const amount = 1 * Math.pow(10, 8) // 1 DARK

  let client

  /**
   * Return a random member of an Array
   * @param {Array} - array
   * @return 1 item of the array
   */
  const getRandom = array => {
    const index = Math.floor(Math.random() * array.length)
    return array[index]
  }

  /**
   * Print an error and exit the app
   * @param {String} - message
   * @param {(Object|Error)} - error
   */
  const fail = (message, error = {}) => {
    // API error message or Error instance message
    const originalError = error.error ? error.error : error.message
    console.error(message, originalError)
    process.exit(1)
  }

  /**
   * Get all the information of a wallet by its address
   * @param {String} address
   * @return {Object} wallet with all the available properties
   */
  const getWallet = async address => {
    try {
      const { data } = await client.resource('wallets').get(address)
      return data.data
    } catch (error) {
      fail(`An error has occured while retrieving the wallet with address ${address}:`, error)
    }
  }

  /**
   * Get a random wallet
   * @return {Object} wallet, but only with some properties
   */
  const getRandomWallet = async () => {
    try {
      const { data } = await client.resource('wallets').all()
      const wallets = data.data
      return getRandom(wallets)
    } catch (error) {
      fail('An error has occured while retrieving the wallets:', error)
    }
  }

  /**
   * Build a transaction using the crypto library and send it with the client
   * @param {String} recipient - the address of the recipient
   * @param {String} senderPublicKey
   * @param {String} passphrase - the sender passphrase
   * @param {Object} the transaction that has been posted
   */
  const postTransaction = async ({ recipient, senderPublicKey, passphrase }) => {
    try {
      const transaction = crypto.transactionBuilder.transfer()
        .amount(amount)
        .vendorField('This is a lovely gift!')
        .recipientId(recipient)
        .senderPublicKey(senderPublicKey)
        .sign(passphrase)
        .getStruct()

      client.resource('transactions').create({ transactions: [transaction] })

      return transaction
    } catch (error) {
      fail('An error has occured while posting the transaction:', error)
    }
  }

  try {
    client = await Client.connect('devnet', version)
  } catch (error) {
    fail('An error has occured while trying to connect to the network:', error.message)
  }

  const sender = process.env.ARK_CLIENT_EXAMPLE_SENDER
  if (!sender) {
    fail('It is necessary to establish the value of the environment variable "ARK_CLIENT_EXAMPLE_SENDER" to an address')
  }

  const passphrase = process.env.ARK_CLIENT_EXAMPLE_PASS
  if (!sender) {
    fail('It is necessary to establish the value of the environment variable "ARK_CLIENT_EXAMPLE_PASS" to the passphrase of the "ARK_CLIENT_EXAMPLE_SENDER" address')
  }

  const senderWallet = await getWallet(sender)

  if (senderWallet.balance < amount) {
    fail(`The sender wallet (${senderWallet.address}) does not have enough balance (${senderWallet.balance} DARK)`)
  }

  const recipientWallet = await getRandomWallet()
  const recipient = recipientWallet.address

  const transaction = await postTransaction({ recipient, senderPublicKey: senderWallet.address, passphrase })
  const explorerUrl = 'https://dexplorer.ark.io/transaction/'
  console.log(`\n\tThe gift has been sent to ${recipient} (${explorerUrl}${transaction.id})\n`)
}

sendGift()
