'use strict'

const path = require('path')
const client = require(path.resolve('../../client/lib'))
const genesisPassphrase = 'peace vanish bleak box tuna woman rally manage undo royal lucky since'

module.exports = async (options) => {
  // for (let i = 0; i < options.number; i++) {
    const transaction = client.transactionBuilder.transfer()
    transaction.amount = 1
    transaction.recipientId = 'AHXtmB84sTZ9Zd35h9Y1vfFvPE2Xzqj8ri'
    transaction.senderPublicKey = 'AHXtmB84sTZ9Zd35h9Y1vfFvPE2Xzqj8ri'
    const keys = client.crypto.getKeys(genesisPassphrase)
    const signature = client.crypto.sign(transaction, keys)
    transaction.signature = signature
  // }
  console.log(transaction)
}
