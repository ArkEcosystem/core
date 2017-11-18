const arkjs = require('arkjs')
const crypto = require('crypto')
const Block = require('./block')

class Delegate {
  constructor (passphrase, network) {
    this.keys = arkjs.crypto.getKeys(passphrase)
    this.publicKey = this.keys.publicKey
    this.address = this.keys.getAddress(network.pubKeyHash)
  }

  // we consider transactions are signed, verified and unique
  forge (transactions, options) {
    const txs = transactions
      .map((tx) => tx.data)
      .sort((a, b) => {
        if (a.type < b.type) return -1
        if (a.type > b.type) return 1
        if (a.id < b.id) return -1
        if (a.id > b.id) return 1
        return 0
      })
    if (!options.version) {
      const txstats = {
        amount: 0,
        fee: 0,
        sha256: crypto.createHash('sha256')
      }
      txs.forEach((tx) => {
        txstats.amount += tx.amount
        txstats.fee += tx.fee
        txstats.sha256.update(Buffer.from(tx.id, 'hex'))
      })

      const data = {
        version: 0,
        generatorPublicKey: this.publicKey,
        timestamp: options.timestamp,
        previousBlock: options.previousBlock.id,
        height: options.previousBlock.height + 1,
        numberOfTransactions: txs.length,
        totalAmount: txstats.amount,
        totalFee: txstats.fee,
        reward: options.reward,
        payloadLength: 32 * txs.length,
        payloadHash: txstats.sha256.digest().toString('hex'),
        transactions: txs
      }

      return Block.create(data, this.keys)
    }
  }
}

module.exports = Delegate
