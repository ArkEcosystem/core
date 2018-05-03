'use strict'

const ark = require('arkjs')
const axios = require('axios')
const generateWallet = require('../utils/generate-wallet')
const genesisPassphrase = 'peace vanish bleak box tuna woman rally manage undo royal lucky since'

module.exports = async (options) => {
  const transactions = []
  for (let i = 0; i < options.number; i++) {
    const wallet = generateWallet()

    const amount = 1 * Math.pow(10, 8)
    const transaction = ark.transaction.createTransaction(wallet.address, amount, `TID: ${i}`, genesisPassphrase)
    transactions.push(transaction)
    console.log(`${i} ==> ${transaction.id}, ${wallet.address}`)
  }

  axios.post('http://localhost:4102/api/v2/transactions', {transactions})
    .then(response => {
      console.log('All transactions have been sent')
    })
    .catch(error => {
      console.log(`There was a problem sending transactions: ${error.message}`)
    })
}
