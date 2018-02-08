const arkjs = require('arkjs')
const bip38 = require('bip38')
const wif = require('wif')
const crypto = require('crypto')
const otplib = require('otplib')
const Block = require('./block')

class Delegate {
  constructor (passphrase, network, password) {
    this.network = network
    if (bip38.verify(passphrase)) {
      this.keys = this.decrypt(passphrase, network, password)
      this.publicKey = this.keys.getPublicKeyBuffer().toString("hex")//this.keys.publicKey
      this.address = this.keys.getAddress(network.pubKeyHash)
      this.otpSecret = otplib.authenticator.generateSecret()
      this.encryptKeysWithOtp()
    }
  }

  static encrypt (passphrase, network, password) {
    const keys = arkjs.crypto.getKeys(passphrase, network)
    const wifKey = keys.toWIF()
    const decoded = wif.decode(wifKey)

    const encryptedKey = bip38.encrypt(decoded.privateKey, decoded.compressed, password)

    return encryptedKey
  }

  encryptKeysWithOtp () {
    this.otp = otplib.authenticator.generate(this.otpSecret)
    const wifKey = this.keys.toWIF()
    const decoded = wif.decode(wifKey)

    this.encryptedKeys = bip38.encrypt(decoded.privateKey, decoded.compressed, this.otp)
    this.keys = null
  }

  decryptKeysWithOtp () {
    this.keys = this.decrypt(this.encryptedKeys, this.network, this.otp)
    this.otp = null
    this.encryptedKeys = null
  }

  decrypt (passphrase, network, password) {
    const decryptedWif = bip38.decrypt(passphrase, password)
    const wifKey = wif.encode(network.wif, decryptedWif.privateKey, decryptedWif.compressed)
    let keys = arkjs.ECPair.fromWIF(wifKey, network)
    keys.publicKey = keys.getPublicKeyBuffer().toString("hex")

    return keys
  }

  // we consider transactions are signed, verified and unique
  forge (transactions, options) {
    if (!options.version && this.encryptedKeys) {
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

      this.decryptKeysWithOtp()
      let block = Block.create(data, this.keys)
      this.encryptKeysWithOtp()

      return block
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

module.exports = Delegate
