'use strict'

const ark = require('arkjs')

const generateWallet = require('../utils/generate-wallet')

module.exports = async (options) => {
  for (let i = 0; i < options.number; i++) {
    const wallet = generateWallet()
    const transaction = ark.vote.createVote(wallet.passphrase, [`+${options.delegate}`])

    console.log(`TX${i}: ${transaction.id}`)

    // send request with axios...
  }
}
