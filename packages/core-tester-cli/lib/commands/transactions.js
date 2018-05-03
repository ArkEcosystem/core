'use strict'

const ark = require('arkjs')

const generateWallet = require('../utils/generate-wallet')

const genesisPassphrase = 'peace vanish bleak box tuna woman rally manage undo royal lucky since'

module.exports = async (options) => {
  for (let i = 0; i < options.number; i++) {
    const wallet = generateWallet()

    const amount = 1 * Math.pow(10, 8)
    const transaction = ark.transaction.createTransaction(wallet.address, amount, `TID: ${i}`, wallet.passphrase)

    console.log(`${i} ==> ${transaction.id}`)

    // send request with axios...
  }
}
