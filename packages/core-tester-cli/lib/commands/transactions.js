'use strict'

const ark = require('arkjs')
const axios = require('axios')
const generateWallet = require('../utils/generate-wallet')
const delegatePassphrase = 'prison tobacco acquire stone dignity palace note decade they current lesson robot'

module.exports = async (options) => {
  const transactions = []
  let totalDeductions = 0
  const address = ark.crypto.getAddress(ark.crypto.getKeys(delegatePassphrase).publicKey)
  const genesisWallet = (await axios.get(`http://localhost:4102/api/v2/wallets/${address}`)).data.data
  console.log(`Wallet starting balance: ${genesisWallet.balance}`)
  for (let i = 0; i < options.number; i++) {
    const wallet = generateWallet()

    const amount = 1 * Math.pow(10, 8)
    const transaction = ark.transaction.createTransaction(wallet.address, amount, `TID: ${i}`, delegatePassphrase)
    totalDeductions += amount + transaction.fee
    transactions.push(transaction)
    console.log(`${i} ==> ${transaction.id}, ${wallet.address}`)
  }
  console.log(`Wallet expected ending balance: ${genesisWallet.balance - totalDeductions}`)

  axios.post('http://localhost:4102/api/v2/transactions', {transactions})
    .then(async response => {
      console.log(`All transactions have been sent`)
      const genesisWalletEnd = (await axios.get(`http://localhost:4102/api/v2/wallets/${address}`)).data.data
      console.log(`Wallet ending balance: ${genesisWalletEnd.balance}`)
    })
    .catch(error => {
      console.log(`There was a problem sending transactions: ${error.message}`)
    })
}
