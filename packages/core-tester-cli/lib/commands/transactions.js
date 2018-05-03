'use strict'

const ark = require('arkjs')

const generateWallet = require('../utils/generate-wallet')

const genesisPassphrase = 'peace vanish bleak box tuna woman rally manage undo royal lucky since'

module.exports = async (options) => {
  for (let i = 0; i < options.number; i++) {
    const amount = 1 * Math.pow(10, 8)
    const transaction = ark.transaction.createTransaction('AHXtmB84sTZ9Zd35h9Y1vfFvPE2Xzqj8ri', amount, 'test', genesisPassphrase)

    console.log(`TX${i}: ${transaction.id}`)

    // send request with axios...
  }
}
