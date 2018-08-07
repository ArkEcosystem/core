const ark = require('arkjs')
const bignum = require('bigi')
const bip39 = require('bip39')
const ByteBuffer = require('bytebuffer')
const crypto = require('crypto')

module.exports = class GenesisBlockBuilder {
  /**
   * Create a new Genesis Block builder instance.
   * @param  {Object} options
   * @return {void}
   */
  constructor (network, options) {
    this.network = network
    this.prefixHash = network.pubKeyHash
    this.totalPremine = options.totalPremine
    this.activeDelegates = options.activeDelegates
    ark.crypto.setNetworkVersion(this.prefixHash)
  }

  /**
   * Generate a Genesis Block.
   * @return {Object}
   */
  generate () {
    const genesisWallet = this.__createWallet()
    const premineWallet = this.__createWallet()
    const delegates = this.__buildDelegates()
    const transactions = [
      ...this.__buildDelegateTransactions(delegates),
      this.__createTransferTransaction(premineWallet, genesisWallet, this.totalPremine)
    ]
    const genesisBlock = this.__createGenesisBlock({
      keys: genesisWallet.keys,
      transactions,
      timestamp: 0
    })

    return {
      genesisWallet,
      genesisBlock,
      delegatePassphrases: delegates.map(wallet => wallet.passphrase)
    }
  }

  /**
   * Generate a new random wallet.
   * @return {Object}
   */
  __createWallet () {
    const passphrase = bip39.generateMnemonic()
    const keys = ark.crypto.getKeys(passphrase, this.network)

    return {
      address: ark.crypto.getAddress(keys.publicKey, this.prefixHash),
      passphrase,
      keys
    }
  }

  /**
   * Generate a random wallet and assign it a delegate username.
   * @param  {String} username
   * @return {Object}
   */
  __createDelegateWallet (username) {
    const wallet = this.__createWallet()
    wallet.username = username

    return wallet
  }

  /**
   * Generate a collection of delegate wallets.
   * @return {Object[]}
   */
  __buildDelegates () {
    const wallets = []
    for (let i = 0; i < this.activeDelegates; i++) {
      wallets.push(this.__createDelegateWallet(`genesis_${i + 1}`))
    }

    return wallets
  }

  /**
   * Generate a collection of delegate registration transactions.
   * @param  {Object[]} wallets
   * @return {Object[]}
   */
  __buildDelegateTransactions (wallets) {
    return wallets.map(wallet => this.__createDelegateTransaction(wallet))
  }

  /**
   * Create transfer transaction.
   * @param  {Object} senderWallet
   * @param  {Object} receiverWallet
   * @param  {Number} amount
   * @return {Object}
   */
  __createTransferTransaction (senderWallet, receiverWallet, amount) {
    return this.__formatGenesisTransaction(
      ark.transaction.createTransaction(receiverWallet.address, amount, null, senderWallet.passphrase, undefined, this.prefixHash),
      senderWallet
    )
  }

  /**
   * Create delegate registration transaction.
   * @param  {Object} wallet
   * @return {Object}
   */
  __createDelegateTransaction (wallet) {
    return this.__formatGenesisTransaction(
      ark.delegate.createDelegate(wallet.passphrase, wallet.username),
      wallet
    )
  }

  /**
   * Reset transaction to be applied in the genesis block.
   * @param  {Object} transaction
   * @param  {Object} wallet
   * @return {Object}
   */
  __formatGenesisTransaction (transaction, wallet) {
    Object.assign(transaction, {
      fee: 0,
      timestamp: 0,
      senderId: wallet.address
    })
    transaction.signature = ark.crypto.sign(transaction, wallet.keys)
    transaction.id = ark.crypto.getId(transaction)

    return transaction
  }

  /**
   * Create block based on data.
   * @param  {Object} data
   * @return {Object}
   */
  __createGenesisBlock (data) {
    const transactions = data.transactions.sort((a, b) => {
      if (a.type === b.type) {
        return a.amount - b.amount
      }

      return a.type - b.type
    })

    let payloadLength = 0
    let totalFee = 0
    let totalAmount = 0
    let payloadHash = crypto.createHash('sha256')

    transactions.forEach(transaction => {
      const bytes = ark.crypto.getBytes(transaction)
      payloadLength += bytes.length
      totalFee += transaction.fee
      totalAmount += transaction.amount
      payloadHash.update(bytes)
    })

    const block = {
      version: 0,
      totalAmount: totalAmount,
      totalFee: totalFee,
      reward: 0,
      payloadHash: payloadHash.digest().toString('hex'),
      timestamp: data.timestamp,
      numberOfTransactions: transactions.length,
      payloadLength,
      previousBlock: null,
      generatorPublicKey: data.keys.publicKey.toString('hex'),
      transactions,
      height: 1
    }

    block.id = this.__getBlockId(block)

    try {
      block.blockSignature = this.__signBlock(block, data.keys)
    } catch (e) {
      throw e
    }

    return block
  }

  /**
   * Work out block id for block.
   * @param  {Object} block
   * @return {String}
   */
  __getBlockId (block) {
    let hash = this.__getHash(block)
    let blockBuffer = Buffer.alloc(8)
    for (let i = 0; i < 8; i++) {
      blockBuffer[i] = hash[7 - i]
    }

    return bignum.fromBuffer(blockBuffer).toString()
  }

  /**
   * Sign block with keys.
   * @param  {Object} block
   * @param  {ECPair]} keys
   * @return {String}
   */
  __signBlock (block, keys) {
    var hash = this.__getHash(block)

    return keys.sign(hash).toDER().toString('hex')
  }

  /**
   * Get hash of block.
   * @param  {Object} block
   * @return {String}
   */
  __getHash (block) {
    return crypto.createHash('sha256').update(this.__getBytes(block)).digest()
  }

  /**
   * Get block bytes.
   * @param  {Object} block
   * @return {(Buffer|undefined)}
   */
  __getBytes (block) {
    const size = 4 + 4 + 4 + 8 + 4 + 4 + 8 + 8 + 4 + 4 + 4 + 32 + 32 + 64

    try {
      var byteBuffer = new ByteBuffer(size, true)
      byteBuffer.writeInt(block.version)
      byteBuffer.writeInt(block.timestamp)
      byteBuffer.writeInt(block.height)

      if (block.previousBlock) {
        var previousBlock = bignum(block.previousBlock).toBuffer({size: '8'})

        for (let i = 0; i < 8; i++) {
          byteBuffer.writeByte(previousBlock[i])
        }
      } else {
        for (let i = 0; i < 8; i++) {
          byteBuffer.writeByte(0)
        }
      }

      byteBuffer.writeInt(block.numberOfTransactions)
      byteBuffer.writeLong(block.totalAmount)
      byteBuffer.writeLong(block.totalFee)
      byteBuffer.writeLong(block.reward)

      byteBuffer.writeInt(block.payloadLength)

      var payloadHashBuffer = Buffer.from(block.payloadHash, 'hex')
      for (let i = 0; i < payloadHashBuffer.length; i++) {
        byteBuffer.writeByte(payloadHashBuffer[i])
      }

      var generatorPublicKeyBuffer = Buffer.from(block.generatorPublicKey, 'hex')
      for (let i = 0; i < generatorPublicKeyBuffer.length; i++) {
        byteBuffer.writeByte(generatorPublicKeyBuffer[i])
      }

      if (block.blockSignature) {
        var blockSignatureBuffer = Buffer.from(block.blockSignature, 'hex')
        for (let i = 0; i < blockSignatureBuffer.length; i++) {
          byteBuffer.writeByte(blockSignatureBuffer[i])
        }
      }

      byteBuffer.flip()
      const buffer = byteBuffer.toBuffer()

      return buffer
    } catch (error) {
      throw error
    }
  }
}
