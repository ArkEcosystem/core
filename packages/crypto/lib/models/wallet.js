const configManager = require('../managers/config')
const { ARKTOSHI, TRANSACTION_TYPES } = require('../constants')
const ECPair = require('../crypto/ecpair')
const ECSignature = require('../crypto/ecsignature')
const cryptoBuilder = require('../builder/crypto')
const transactionHandler = require('../handlers/transactions')

/**
 * TODO copy some parts to ArkDocs
 * @classdesc This class holds the wallet data, verifies it and applies the
 * transaction and blocks to it
 *
 * Wallet attributes that are stored on the db:
 *   - address
 *   - publicKey
 *   - secondPublicKey
 *   - balance
 *   - vote
 *   - username (name, if the wallet is a delegate)
 *   - voteBalance (number of votes if the wallet is a delegate)
 *   - producedBlocks
 *   - missedBlocks
 *
 * This other attributes are not stored on the db:
 *   - multisignature
 *   - lastBlock (last block applied or `null``)
 *   - dirty
 */
module.exports = class Wallet {
  /**
   * @constructor
   * @param  {String} address
   */
  constructor (address) {
    this.address = address
    this.publicKey = null
    this.secondPublicKey = null
    this.balance = 0
    this.vote = null
    this.voted = false
    this.username = null
    this.lastBlock = null
    this.votebalance = 0
    this.multisignature = null
    this.dirty = true
    this.producedBlocks = 0
    this.missedBlocks = 0
  }

  /**
   * Check if can apply a transaction to the wallet.
   * @param  {Transaction} transaction
   * @return {Boolean}
   */
  canApply (transaction) {
    return transactionHandler.canApply(this, transaction)
  }

  /**
   * Apply the specified transaction to this wallet.
   * @param  {Transaction} transaction
   * @return {Boolean}
   */
  apply (transaction) {
    return transactionHandler.apply(this, transaction)
  }

  /**
   * Revert the specified transaction from this wallet.
   * @param  {Transaction} transaction
   * @return {Boolean}
   */
  revert (transaction) {
    return transactionHandler.revert(this, transaction)
  }

  /**
   * Associate this wallet as the sender of a transaction.
   * @param {Transaction} transaction
   */
  applyTransactionToSender (transaction) {
    return transactionHandler.applyTransactionToSender(this, transaction)
  }

  /**
   * Remove this wallet as the sender of a transaction.
   * @param {Transaction} transaction
   */
  revertTransactionForSender (transaction) {
    return transactionHandler.revertTransactionForSender(this, transaction)
  }

  /**
   * Add transaction balance to this wallet.
   * @param {Transaction} transaction
   */
  applyTransactionToRecipient (transaction) {
    return transactionHandler.applyTransactionToRecipient(this, transaction)
  }

  /**
   * Remove transaction balance from this wallet.
   * @param {Transaction} transaction
   */
  revertTransactionForRecipient (transaction) {
    return transactionHandler.revertTransactionForRecipient(this, transaction)
  }

  /**
   * Add block data to this wallet.
   * @param {Block} block
   */
  applyBlock (block) {
    if (block.generatorPublicKey === this.publicKey || cryptoBuilder.getAddress(block.generatorPublicKey) === this.address) {
      this.balance += block.reward + block.totalFee
      this.producedBlocks++
      this.lastBlock = block
    }

    this.dirty = true
  }

  /**
   * Remove block data from this wallet.
   * @param {Block} block
   */
  revertBlock (block) {
    if (block.generatorPublicKey === this.publicKey || cryptoBuilder.getAddress(block.generatorPublicKey) === this.address) {
      this.balance -= block.reward + block.totalFee
      this.producedBlocks--
      // TODO: get it back from database?
      this.lastBlock = null
    }

    this.dirty = true
  }

  /**
   * Verify the wallet.
   * @param  {Transaction} transaction
   * @param  {String}      signature
   * @param  {String}      publicKey
   * @return {Boolean}
   */
  verify (transaction, signature, publicKey) {
    const hash = cryptoBuilder.getHash(transaction)
    const signSignatureBuffer = Buffer.from(signature, 'hex')
    const publicKeyBuffer = Buffer.from(publicKey, 'hex')
    const ecpair = ECPair.fromPublicKeyBuffer(publicKeyBuffer, configManager.config)
    const ecsignature = ECSignature.fromDER(signSignatureBuffer)

    return ecpair.verify(hash, ecsignature)
  }

  /**
   * Verify multi-signatures for the wallet.
   * @param  {Transaction}    transaction
   * @param  {MultiSignature} multisignature
   * @return {Boolean}
   */
  verifySignatures (transaction, multisignature) {
    if (!transaction.signatures || !transaction.signatures.length > multisignature.min - 1) {
      return false
    }

    const truncatePlus = (publicKey) => publicKey.startsWith('+') ? publicKey.slice(1) : publicKey

    let index = 0
    let publicKey = truncatePlus(multisignature.keysgroup[index])

    for (let i in transaction.signatures) {
      if (!this.verify(transaction, transaction.signatures[i], publicKey)) {
        if (index++ > transaction.signatures.length - 1) {
          return false
        }

        if (index < multisignature.keysgroup.length) {
          publicKey = truncatePlus(multisignature.keysgroup[index])
        }
      }
    }

    return true
  }

  /**
   * Audit the specified transaction.
   * @param  {Transaction} transaction
   * @return {[type]}
   */
  auditApply (transaction) {
    const audit = []

    audit.push({'Network': configManager.config})

    if (this.multisignature) {
      audit.push({'Mutisignature': this.verifySignatures(transaction, this.multisignature)})
    } else {
      audit.push({'Remaining amount': this.balance - transaction.amount - transaction.fee})
      audit.push({'Signature validation': cryptoBuilder.verify(transaction)})
      // TODO: this can blow up if 2nd phrase and other transactions are in the wrong order
      if (this.secondPublicKey) {
        audit.push({
          'Second Signature Verification': cryptoBuilder.verifySecondSignature(transaction, this.secondPublicKey, configManager.config) // eslint-disable-line max-len
        })
      }
    }

    if (transaction.type === TRANSACTION_TYPES.TRANSFER) {
      audit.push({'Transfert': true})
    }

    if (transaction.type === TRANSACTION_TYPES.SECOND_SIGNATURE) {
      audit.push({'Second public key': this.secondPublicKey})
    }

    if (transaction.type === TRANSACTION_TYPES.DELEGATE_REGISTRATION) {
      const username = transaction.asset.delegate.username
      audit.push({'Current username': this.username})
      audit.push({'New username': username})
    }

    if (transaction.type === TRANSACTION_TYPES.VOTE) {
      audit.push({'Current vote': this.vote})
      audit.push({'New vote': transaction.asset.votes[0]})
    }

    if (transaction.type === TRANSACTION_TYPES.MULTI_SIGNATURE) {
      const keysgroup = transaction.asset.multisignature.keysgroup
      audit.push({'Multisignature not yet registered': !this.multisignature})
      audit.push({'Multisignature enough keys': keysgroup.length >= transaction.asset.multisignature.min})
      audit.push({'Multisignature all keys signed': keysgroup.length === transaction.signatures.length})
      audit.push({'Multisignature verification': this.verifySignatures(transaction, transaction.asset.multisignature)})
    }

    if (transaction.type === TRANSACTION_TYPES.IPFS) {
      audit.push({'IPFS': true})
    }

    if (transaction.type === TRANSACTION_TYPES.TIMELOCK_TRANSFER) {
      audit.push({'Timelock': true})
    }

    if (transaction.type === TRANSACTION_TYPES.MULTI_PAYMENT) {
      const amount = transaction.asset.payments.reduce((a, p) => (a += p.amount), 0)
      audit.push({'Multipayment remaining amount': amount})
    }

    if (transaction.type === TRANSACTION_TYPES.DELEGATE_RESIGNATION) {
      audit.push({'Resignate Delegate': this.username})
    }

    if (transaction.type === TRANSACTION_TYPES.DELEGATE_RESIGNATION) {
      audit.push({'Resignate Delegate': this.username})
    }

    if (!Object.keys(TRANSACTION_TYPES).includes(transaction.type)) {
      audit.push({'Unknown Type': true})
    }

    return audit
  }

  /**
   * Get formatted wallet balance as string.
   * @return {String}
   */
  toString () {
    return `${this.address}=${this.balance / ARKTOSHI}`
  }
}
