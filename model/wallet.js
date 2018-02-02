const arkjs = require('arkjs')
const config = require('core/config')

module.exports = class Wallet {
  constructor (address) {
    this.address = address
    this.publicKey = null
    this.secondPublicKey = null
    this.balance = 0
    this.vote = null
    this.username = null
    this.votebalance = 0
    this.multisignature = null
    this.dirty = true
    this.producedBlocks = 0
    this.missedBlocks = 0
  }

  toString () {
    // TODO is it 10000000 or 100000000 TODO use constant to avoid typos
    return `${this.address}=${this.balance / 100000000}`
  }

  applyTransactionToSender (transaction) {
    if (transaction.senderPublicKey === this.publicKey || arkjs.crypto.getAddress(transaction.senderPublicKey) === this.address) {
      this.balance -= transaction.amount + transaction.fee
      switch (transaction.type) {
        case 1:
          this.secondPublicKey = transaction.asset.signature.publicKey
          break
        case 2:
          this.username = transaction.asset.delegate.username
          break
        case 3:
          if (transaction.asset.votes[0].startsWith('+')) {
            this.vote = transaction.asset.votes[0].slice(1)
          } else if (transaction.asset.votes[0].startsWith('-')) {
            this.vote = null
          }
          break
        case 4:
          this.multisignature = transaction.asset.multisignature
      }
      this.dirty = true
    }
  }

  undoTransactionToSender (transaction) {
    if (transaction.senderPublicKey === this.publicKey || arkjs.crypto.getAddress(transaction.senderPublicKey) === this.address) {
      this.balance += transaction.amount + transaction.fee
      switch (transaction.type) {
        case 1:
          this.secondPublicKey = null
          break
        case 2:
          this.username = null
          break
        case 3:
          if (transaction.asset.votes[0].startsWith('+')) {
            this.vote = null
          } else if (transaction.asset.votes[0].startsWith('-')) {
            this.vote = transaction.asset.votes[0].slice(1)
          }
          break
        case 4:
          this.multisignature = null
          break
        case 5:
          break
        case 6:
          break
        case 7:
          break
      }
      this.dirty = true
    }
  }

  applyTransactionToRecipient (transaction) {
    if (transaction.recipientId === this.address) {
      this.balance += transaction.amount
      this.dirty = true
    }
  }

  undoTransactionToRecipient (transaction) {
    if (transaction.recipientId === this.address) {
      this.balance -= transaction.amount
      this.dirty = true
    }
  }

  applyBlock (block) {
    if (block.generatorPublicKey === this.publicKey || arkjs.crypto.getAddress(block.generatorPublicKey) === this.address) {
      this.balance += block.reward + block.totalFee
      this.producedBlocks++
    }
    this.dirty = true
  }

  undoBlock (block) {
    if (block.generatorPublicKey === this.publicKey || arkjs.crypto.getAddress(block.generatorPublicKey) === this.address) {
      this.balance -= block.reward + block.totalFee
      this.producedBlocks--
    }
    this.dirty = true
  }

  canApply (transaction) {
    let check = true
    if (this.multisignature) {
      check = check && this.verifySignatures(transaction, this.multisignature)
    } else {
      check = check && (transaction.senderPublicKey === this.publicKey) && (this.balance - transaction.amount - transaction.fee > -1)
      check = check && (!this.secondPublicKey || arkjs.crypto.verifySecondSignature(transaction, this.secondPublicKey, config.network))
    }
    if (!check) return false

    switch (transaction.type) {
      case 0: // transfer
        return true

      case 1: // second signature registration
        return !this.secondPublicKey

      case 2:
        const username = transaction.asset.delegate.username
        return !this.username && username && username === username.toLowerCase()

      case 3:
        if (transaction.asset.votes[0].startsWith('-') && this.vote) return true
        else if (transaction.asset.votes[0].startsWith('+') && !this.vote) return true
        else return false

      case 4:
        return !this.multisignature && transaction.asset.multisignature.keysgroup.length >= transaction.asset.multisignature.min - 1 && transaction.asset.multisignature.keysgroup.length === transaction.signatures.length && this.verifySignatures(transaction, transaction.asset.multisignature)

      case 5:
        return true

      case 6:
        return true

      case 7: // multipayment
        return this.balance - transaction.asset.payments.reduce((a, p) => (a += p.amount), 0) - transaction.fee > -1

      case 8: // delegate resignation
        return !!this.username

      default:
        return false
    }
  }

  verifySignatures (transaction, multisignature) {
    if (!transaction.signatures || !transaction.signatures.length > multisignature.min - 1) return false
    let index = 0
    let publicKey = multisignature.keysgroup[index].slice(1)

    for (let i in transaction.signatures) {
      if (!verify(transaction, transaction.signatures[i], publicKey)) {
        if (index++ > transaction.signatures.length - 1) return false
        else if (index < multisignature.keysgroup.length) publicKey = multisignature.keysgroup[index].slice(1)
      }
    }
    return true
  }
}

function verify (transaction, signature, publicKey) {
  const hash = arkjs.crypto.getHash(transaction)
  const signSignatureBuffer = Buffer.from(signature, 'hex')
  const publicKeyBuffer = Buffer.from(publicKey, 'hex')
  const ecpair = arkjs.ECPair.fromPublicKeyBuffer(publicKeyBuffer, config.network)
  const ecsignature = arkjs.ECSignature.fromDER(signSignatureBuffer)
  return ecpair.verify(hash, ecsignature)
}
