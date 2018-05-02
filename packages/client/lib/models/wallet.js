const configManager = require('../managers/config')
const { ARKTOSHI, TRANSACTION_TYPES } = require('../constants')
const ECPair = require('../crypto/ecpair')
const ECSignature = require('../crypto/ecsignature')
const cryptoBuilder = require('../builder/crypto')

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
    this.username = null
    this.lastBlock = null
    this.votebalance = 0
    this.multisignature = null
    this.dirty = true
    this.producedBlocks = 0
    this.missedBlocks = 0
  }

  /**
   * Associate this wallet as the sender of a transaction.
   * @param {Transaction} transaction
   */
  applyTransactionToSender (transaction) {
    if (transaction.senderPublicKey === this.publicKey || cryptoBuilder.getAddress(transaction.senderPublicKey) === this.address) {
      this.balance -= transaction.amount + transaction.fee

      if (transaction.type === TRANSACTION_TYPES.SECOND_SIGNATURE) {
        this.secondPublicKey = transaction.asset.signature.publicKey
      } else if (transaction.type === TRANSACTION_TYPES.DELEGATE) {
        this.username = transaction.asset.delegate.username
      } else if (transaction.type === TRANSACTION_TYPES.VOTE) {
        if (transaction.asset.votes[0].startsWith('+')) {
          this.vote = transaction.asset.votes[0].slice(1)
        } else if (transaction.asset.votes[0].startsWith('-')) {
          this.vote = null
        }
      } else if (transaction.type === TRANSACTION_TYPES.MULTI_SIGNATURE) {
        this.multisignature = transaction.asset.multisignature
      }

      this.dirty = true
    }
  }

  /**
   * Remove this wallet as the sender of a transaction.
   * @param {Transaction} transaction
   */
  undoTransactionToSender (transaction) {
    if (transaction.senderPublicKey === this.publicKey || cryptoBuilder.getAddress(transaction.senderPublicKey) === this.address) {
      this.balance += transaction.amount + transaction.fee

      if (transaction.type === TRANSACTION_TYPES.SECOND_SIGNATURE) {
        this.secondPublicKey = null
      } else if (transaction.type === TRANSACTION_TYPES.DELEGATE) {
        this.username = null
      } else if (transaction.type === TRANSACTION_TYPES.VOTE) {
        if (transaction.asset.votes[0].startsWith('+')) {
          this.vote = null
        } else if (transaction.asset.votes[0].startsWith('-')) {
          this.vote = transaction.asset.votes[0].slice(1)
        }
      } else if (transaction.type === TRANSACTION_TYPES.MULTI_SIGNATURE) {
        this.multisignature = null
      }

      this.dirty = true
    }
  }

  /**
   * Add transaction balance to this wallet.
   * @param {Transaction} transaction
   */
  applyTransactionToRecipient (transaction) {
    if (transaction.recipientId === this.address) {
      this.balance += transaction.amount
      this.dirty = true
    }
  }

  /**
   * Remove transaction balance from this wallet.
   * @param {Transaction} transaction
   */
  undoTransactionToRecipient (transaction) {
    if (transaction.recipientId === this.address) {
      this.balance -= transaction.amount
      this.dirty = true
    }
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
  undoBlock (block) {
    if (block.generatorPublicKey === this.publicKey || cryptoBuilder.getAddress(block.generatorPublicKey) === this.address) {
      this.balance -= block.reward + block.totalFee
      this.producedBlocks--
      // TODO: get it back from database?
      this.lastBlock = null
    }
    this.dirty = true
  }

  /**
   * Check if can apply a transaction to the wallet.
   * @param  {Transaction} transaction
   * @return {Boolean}
   */
  canApply (transaction) {
    let check = true

    if (this.multisignature) {
      check = check && this.verifySignatures(transaction, this.multisignature)
    } else {
      check = check && (transaction.senderPublicKey === this.publicKey) && (this.balance - transaction.amount - transaction.fee > -1)
      // TODO: this can blow up if 2nd phrase and other tx are in the wrong order
      check = check && (!this.secondPublicKey || cryptoBuilder.verifySecondSignature(transaction, this.secondPublicKey, configManager.config)) // eslint-disable-line max-len
    }

    if (!check) {
      return false
    }

    if (transaction.type === TRANSACTION_TYPES.TRANSFER) {
      return true
    } else if (transaction.type === TRANSACTION_TYPES.VOTE) {
      if (transaction.asset.votes[0].startsWith('-')) return this.vote === transaction.asset.votes[0].slice(1)
      if (transaction.asset.votes[0].startsWith('+') && !this.vote) return true
      return false
    } else if (transaction.type === TRANSACTION_TYPES.SECOND_SIGNATURE) {
      return !this.secondPublicKey
    } else if (transaction.type === TRANSACTION_TYPES.DELEGATE) {
      const username = transaction.asset.delegate.username
      return !this.username && username && username === username.toLowerCase()
    } else if (transaction.type === TRANSACTION_TYPES.MULTI_SIGNATURE) {
      const keysgroup = transaction.asset.multisignature.keysgroup
      return !this.multisignature &&
        keysgroup.length >= transaction.asset.multisignature.min &&
        keysgroup.length === transaction.signatures.length &&
        this.verifySignatures(transaction, transaction.asset.multisignature)
    } else if (transaction.type === TRANSACTION_TYPES.IPFS) {
      return true
    } else if (transaction.type === TRANSACTION_TYPES.TIMELOCK_TRANSFER) {
      return true
    } else if (transaction.type === TRANSACTION_TYPES.MULTI_PAYMENT) {
      const amount = transaction.asset.payments.reduce((a, p) => (a += p.amount), 0)
      return this.balance - amount - transaction.fee > -1
    } else if (transaction.type === TRANSACTION_TYPES.DELEGATE_RESIGNATION) {
      return !!this.username
    }
    return false
  }

  auditApply (transaction) {
    const audit = []
    audit.push({'Network': configManager.config})
    if (this.multisignature) {
      audit.push({'Mutisignature': this.verifySignatures(transaction, this.multisignature)})
    } else {
      audit.push({'Remaining amount': this.balance - transaction.amount - transaction.fee})
      audit.push({'Signature validation': cryptoBuilder.verify(transaction)})
      // TODO: this can blow up if 2nd phrase and other tx are in the wrong order
      if (this.secondPublicKey) {
        audit.push({
          'Second Signature Verification': cryptoBuilder.verifySecondSignature(transaction, this.secondPublicKey, configManager.config) // eslint-disable-line max-len
        })
      }
    }

    if (transaction.type === TRANSACTION_TYPES.TRANSFER) {
      audit.push({'Transfert': true})
    } else if (transaction.type === TRANSACTION_TYPES.SECOND_SIGNATURE) {
      audit.push({'Second public key': this.secondPublicKey})
    } else if (transaction.type === TRANSACTION_TYPES.DELEGATE) {
      const username = transaction.asset.delegate.username
      audit.push({'Current username': this.username})
      audit.push({'New username': username})
    } else if (transaction.type === TRANSACTION_TYPES.VOTE) {
      audit.push({'Current vote': this.vote})
      audit.push({'New vote': transaction.asset.votes[0]})
    } else if (transaction.type === TRANSACTION_TYPES.MULTI_SIGNATURE) {
      const keysgroup = transaction.asset.multisignature.keysgroup
      audit.push({'Multisignature not yet registered': !this.multisignature})
      audit.push({'Multisignature enough keys': keysgroup.length >= transaction.asset.multisignature.min})
      audit.push({'Multisignature all keys signed': keysgroup.length === transaction.signatures.length})
      audit.push({'Multisignature verification': this.verifySignatures(transaction, transaction.asset.multisignature)})
    } else if (transaction.type === TRANSACTION_TYPES.IPFS) {
      audit.push({'IPFS': true})
    } else if (transaction.type === TRANSACTION_TYPES.TIMELOCK_TRANSFER) {
      audit.push({'Timelock': true})
    } else if (transaction.type === TRANSACTION_TYPES.MULTI_PAYMENT) {
      const amount = transaction.asset.payments.reduce((a, p) => (a += p.amount), 0)
      audit.push({'Multipayment remaining amount': amount})
    } else if (transaction.type === TRANSACTION_TYPES.DELEGATE_RESIGNATION) {
      audit.push({'Resignate Delegate': this.username})
    } else {
      audit.push({'Unknown Type': true})
    }

    return audit
  }

  /**
   * Verify multi-signatures for the wallet.
   * @param  {Transaction}    transaction
   * @param  {MultiSignature} multisignature
   * @return {Boolean}
   */
  verifySignatures (transaction, multisignature) {
    if (!transaction.signatures || !transaction.signatures.length > multisignature.min - 1) return false
    let index = 0
    let publicKey = multisignature.keysgroup[index].slice(1)

    for (let i in transaction.signatures) {
      if (!this.verify(transaction, transaction.signatures[i], publicKey)) {
        if (index++ > transaction.signatures.length - 1) return false
        else if (index < multisignature.keysgroup.length) publicKey = multisignature.keysgroup[index].slice(1)
      }
    }

    return true
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
   * Get formatted wallet balance as string.
   * @return {String}
   */
  toString () {
    return `${this.address}=${this.balance / ARKTOSHI}`
  }
}
