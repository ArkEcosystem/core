'use strict'

const ark = require('arkjs')
const superheroes = require('superheroes')

const generateWallet = require('../utils/generate-wallet')

module.exports = async (options) => {
  for (let i = 0; i < options.number; i++) {
    const wallet = generateWallet()
    const transaction = ark.delegate.createDelegate(wallet.passphrase, superheroes.random())

    console.log(`${i} ==> ${transaction.id}`)

    // send request with axios...
  }
}
