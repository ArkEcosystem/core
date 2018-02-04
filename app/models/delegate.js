const arkjs = require('arkjs')
const crypto = require('crypto')
const Block = require('./block')

module.exports = class Delegate {
  constructor (passphrase, network) {
    this.keys = arkjs.crypto.getKeys(passphrase)
    this.publicKey = this.keys.publicKey
    this.address = this.keys.getAddress(network.pubKeyHash)
  }

  // we consider transactions are signed, verified and unique
  forge (transactions, options) {
    if (!options.version) {
      const txstats = {
        amount: 0,
        fee: 0,
        sha256: crypto.createHash('sha256')
      }

      const txs = Delegate.sortTransactions(transactions)
      txs.forEach(tx => {
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

  // TODO move as a re-usable utility?
  static sortTransactions (transactions) {
    // Map to create a new array (sort is done in place)
    // TODO does it matter modifying the order of the original array
    return transactions.map(t => t)
      .sort((a, b) => {
        if (a.type < b.type) return -1
        if (a.type > b.type) return 1
        if (a.id < b.id) return -1
        if (a.id > b.id) return 1
        return 0
      })
  }
}
