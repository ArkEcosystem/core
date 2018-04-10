import config from '@/managers/config'
import { ARKTOSHI, TRANSACTION_TYPES } from '@/constants'
import ECPair from '@/crypto/ecpair'
import ECSignature from '@/crypto/ecsignature'
import cryptoBuilder from '@/builder/crypto'

export default class Wallet {
  /**
   * @constructor
   * @param  {String} address [description]
   * @return {[type]}         [description]
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
   * [applyTransactionToSender description]
   * @param  {[type]} transaction [description]
   * @return {[type]}             [description]
   */
  applyTransactionToSender (transaction) {
    if (transaction.senderPublicKey === this.publicKey || cryptoBuilder.getAddress(transaction.senderPublicKey) === this.address) {
      this.balance -= transaction.amount + transaction.fee

      const actions = {
        [TRANSACTION_TYPES.TRANSFER]: () => (true),
        [TRANSACTION_TYPES.SECOND_SIGNATURE]: () => (this.secondPublicKey = transaction.asset.signature.publicKey),
        [TRANSACTION_TYPES.DELEGATE]: () => (this.username = transaction.asset.delegate.username),
        [TRANSACTION_TYPES.VOTE]: () => {
          if (transaction.asset.votes[0].startsWith('+')) {
            this.vote = transaction.asset.votes[0].slice(1)
          } else if (transaction.asset.votes[0].startsWith('-')) {
            this.vote = null
          }
        },
        [TRANSACTION_TYPES.MULTI_SIGNATURE]: () => (this.multisignature = transaction.asset.multisignature),
        'default': () => (false)
      }

      actions[transaction.type] ? actions[transaction.type]() : actions['default']()

      this.dirty = true
    }
  }

  /**
   * [undoTransactionToSender description]
   * @param  {[type]} transaction [description]
   * @return {[type]}             [description]
   */
  undoTransactionToSender (transaction) {
    if (transaction.senderPublicKey === this.publicKey || cryptoBuilder.getAddress(transaction.senderPublicKey) === this.address) {
      this.balance += transaction.amount + transaction.fee

      const actions = {
        [TRANSACTION_TYPES.SECOND_SIGNATURE]: () => (this.secondPublicKey = null),
        [TRANSACTION_TYPES.DELEGATE]: () => (this.username = null),
        [TRANSACTION_TYPES.VOTE]: () => {
          if (transaction.asset.votes[0].startsWith('+')) {
            this.vote = null
          } else if (transaction.asset.votes[0].startsWith('-')) {
            this.vote = transaction.asset.votes[0].slice(1)
          }
        },
        [TRANSACTION_TYPES.MULTI_SIGNATURE]: () => (this.multisignature = null),
        [TRANSACTION_TYPES.IPFS]: () => {},
        [TRANSACTION_TYPES.TIMELOCK_TRANSFER]: () => {},
        [TRANSACTION_TYPES.MULTI_PAYMENT]: () => {},
        'default': () => (false)
      }

      actions[transaction.type] ? actions[transaction.type]() : actions['default']()

      this.dirty = true
    }
  }

  /**
   * [applyTransactionToRecipient description]
   * @param  {[type]} transaction [description]
   * @return {[type]}             [description]
   */
  applyTransactionToRecipient (transaction) {
    if (transaction.recipientId === this.address) {
      this.balance += transaction.amount
      this.dirty = true
    }
  }

  /**
   * [undoTransactionToRecipient description]
   * @param  {[type]} transaction [description]
   * @return {[type]}             [description]
   */
  undoTransactionToRecipient (transaction) {
    if (transaction.recipientId === this.address) {
      this.balance -= transaction.amount
      this.dirty = true
    }
  }

  /**
   * [applyBlock description]
   * @param  {[type]} block [description]
   * @return {[type]}       [description]
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
   * [undoBlock description]
   * @param  {[type]} block [description]
   * @return {[type]}       [description]
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
   * [canApply description]
   * @param  {[type]} transaction [description]
   * @return {[type]}             [description]
   */
  canApply (transaction) {
    let check = true

    if (this.multisignature) {
      check = check && this.verifySignatures(transaction, this.multisignature)
    } else {
      check = check && (transaction.senderPublicKey === this.publicKey) && (this.balance - transaction.amount - transaction.fee > -1)
      // TODO: this can blow up if 2nd phrase and other tx are in the wrong order
      check = check && (!this.secondPublicKey || cryptoBuilder.verifySecondSignature(transaction, this.secondPublicKey, config.network))
    }

    if (!check) {
      return false
    }

    const actions = {
      [TRANSACTION_TYPES.TRANSFER]: () => (true), // transfer
      [TRANSACTION_TYPES.SECOND_SIGNATURE]: () => (!this.secondPublicKey), // second signature registration
      [TRANSACTION_TYPES.DELEGATE] () {
        const username = transaction.asset.delegate.username
        return !this.username && username && username === username.toLowerCase()
      },
      [TRANSACTION_TYPES.VOTE] () {
        if (transaction.asset.votes[0].startsWith('-') && this.vote) return true
        if (transaction.asset.votes[0].startsWith('+') && !this.vote) return true

        return false
      },
      [TRANSACTION_TYPES.MULTI_SIGNATURE] () {
        const keysgroup = transaction.asset.multisignature.keysgroup

        return !this.multisignature &&
          keysgroup.length >= transaction.asset.multisignature.min - 1 &&
          keysgroup.length === transaction.signatures.length &&
          this.verifySignatures(transaction, transaction.asset.multisignature)
      },
      [TRANSACTION_TYPES.IPFS]: () => (true),
      [TRANSACTION_TYPES.TIMELOCK_TRANSFER]: () => (true),
      [TRANSACTION_TYPES.MULTI_PAYMENT] () {
        const amount = transaction.asset.payments.reduce((a, p) => (a += p.amount), 0)
        return this.balance - amount - transaction.fee > -1
      },
      [TRANSACTION_TYPES.DELEGATE_RESIGNATION]: () => (!!this.username), // delegate resignation
      'default': () => (false)
    }

    return actions[transaction.type]
      ? actions[transaction.type]()
      : actions['default']()
  }

  /**
   * [verifySignatures description]
   * @param  {[type]} transaction    [description]
   * @param  {[type]} multisignature [description]
   * @return {[type]}                [description]
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
   * [verify description]
   * @param  {[type]} transaction [description]
   * @param  {String} signature   [description]
   * @param  {String} publicKey   [description]
   * @return {[type]}             [description]
   */
  verify (transaction, signature, publicKey) {
    const hash = cryptoBuilder.getHash(transaction)
    const signSignatureBuffer = Buffer.from(signature, 'hex')
    const publicKeyBuffer = Buffer.from(publicKey, 'hex')
    const ecpair = ECPair.fromPublicKeyBuffer(publicKeyBuffer, config.network)
    const ecsignature = ECSignature.fromDER(signSignatureBuffer)
    return ecpair.verify(hash, ecsignature)
  }

  /**
   * [toString description]
   * @return {String} [description]
   */
  toString () {
    return `${this.address}=${this.balance / ARKTOSHI}`
  }
}
