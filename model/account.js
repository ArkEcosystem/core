const arkjs = require('arkjs')
const config = requireFrom('core/config')

class Account {
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
          this.username = transaction.asset.username
          break
        case 3:
          if (transaction.asset.votes[0].startsWith('+')) {
            this.vote = transaction.asset.votes[0].slice(1)
          } else if (transaction.asset.votes[0].startsWith('-')) {
            this.vote = this.previousVote
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
          if (transaction.asset.votes[0].startsWith('+')) { this.vote = null } else if (transaction.asset.votes[0].startsWith('-')) { this.vote = transaction.asset.votes[0].slice(1) }
          break
        case 4:
          this.multisignature = null
          break
        case 5:
          break
        case 6:
          break
        case 7:
          this.multisignature = null
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
    }
    this.dirty = true
  }

  undoBlock (block) {
    if (block.generatorPublicKey === this.publicKey || arkjs.crypto.getAddress(block.generatorPublicKey) === this.address) {
      this.balance -= block.reward + block.totalFee
    }
    this.dirty = true
  }

  canApply (transaction) {
    let check = true
    if (this.multisignature) {
      check = check && this.verifySignatures(transaction)
    } else {
      check = check && (transaction.senderPublicKey === this.publicKey) && (this.balance - transaction.amount - transaction.fee > -1)
      check = check && (!this.secondPublicKey || arkjs.crypto.verifySecondSignature(transaction, this.secondPublicKey, config.network))
    }
    // console.log(check)
    if (!check) return false

    switch (transaction.type) {
      case 0: // transfer
        return true

      case 1: // second signature registration
        return !this.secondPublicKey

      case 2:
        return !this.username

      case 3:
        if (transaction.asset.votes[0].startsWith('-') && this.vote) return true
        else if (transaction.asset.votes[0].startsWith('+') && !this.vote) return true
        else return false

      case 4:
        return !this.multisignature && transaction.signatures.length === transaction.asset.multisignature.keysgroup.length

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

  verifySignatures (transaction) {
    let validSignatures = 0
    if (!transaction.signatures) return false

    return true
  }
}

module.exports = Account
