'use strict'

const { TRANSACTION_TYPES } = require('../constants')

class TransactionValidator {
  constructor () {
    this.rules = {
      [TRANSACTION_TYPES.TRANSFER]: require('../rules/models/transactions/transfer'),
      [TRANSACTION_TYPES.SECOND_SIGNATURE]: require('../rules/models/transactions/second-signature'),
      [TRANSACTION_TYPES.DELEGATE_REGISTRATION]: require('../rules/models/transactions/delegate-registration'),
      [TRANSACTION_TYPES.VOTE]: require('../rules/models/transactions/vote'),
      [TRANSACTION_TYPES.MULTI_SIGNATURE]: require('../rules/models/transactions/multi-signature'),
      [TRANSACTION_TYPES.IPFS]: require('../rules/models/transactions/ipfs'),
      [TRANSACTION_TYPES.TIMELOCK_TRANSFER]: require('../rules/models/transactions/timelock-transfer'),
      [TRANSACTION_TYPES.MULTI_PAYMENT]: require('../rules/models/transactions/multi-payment'),
      [TRANSACTION_TYPES.DELEGATE_RESIGNATION]: require('../rules/models/transactions/delegate-resignation')
    }
  }

  validate (transaction) {
    return this.rules[transaction.type](transaction)
  }

  // TODO: Test all below rules from ark-node (v1) against new rules
  //
  // __validateSecondSignature (transaction) {
  //   if (!transaction.asset || !transaction.asset.signature) {
  //     return cb('Invalid transaction asset')
  //   }

  //   if (transaction.amount !== 0) {
  //     return cb('Invalid transaction amount')
  //   }

  //   try {
  //     if (!transaction.asset.signature.publicKey || new Buffer(transaction.asset.signature.publicKey, 'hex').length !== 33) {
  //       return cb('Invalid public key')
  //     }
  //   } catch (e) {
  //     library.logger.error("stack", e.stack)
  //     return cb('Invalid public key')
  //   }
  // }

  // __validateDelegateRegistration (transaction) {
  //   if (transaction.recipientId) {
  //     return cb('Invalid recipient')
  //   }

  //   if (transaction.amount !== 0) {
  //     return cb('Invalid transaction amount')
  //   }

  //   if (sender.isDelegate) {
  //     return cb('Account is already a delegate')
  //   }

  //   if (!transaction.asset || !transaction.asset.delegate) {
  //     return cb('Invalid transaction asset')
  //   }

  //   if (!transaction.asset.delegate.username) {
  //     return cb('Username is undefined')
  //   }

  //   if (transaction.asset.delegate.username !== transaction.asset.delegate.username.toLowerCase()) {
  //     return cb('Username must be lowercase')
  //   }

  //   var allowSymbols = /^[a-z0-9!@$&_.]+$/g
  //   var username = String(transaction.asset.delegate.username).toLowerCase().trim()
  //   if (username === '') {
  //     return cb('Empty username')
  //   }

  //   if (username.length > 20) {
  //     return cb('Username is too long. Maximum is 20 characters')
  //   }

  //   if (!allowSymbols.test(username)) {
  //     return cb('Username can only contain alphanumeric characters with the exception of !@$&_.')
  //   }

  //   if (walletManager.getWalletByUsername(username)) {
  //     return cb('Username already exists')
  //   }
  // }

  // __validateVote (transaction) {
  //   if (transaction.recipientId !== transaction.senderId) {
  //     return cb('Invalid recipient')
  //   }

  //   if (!transaction.asset || !transaction.asset.votes) {
  //     return cb('Invalid transaction asset')
  //   }

  //   if (!Array.isArray(transaction.asset.votes)) {
  //     return cb('Invalid votes. Must be an array')
  //   }

  //   if (!transaction.asset.votes.length) {
  //     return cb('Invalid votes. Must not be empty')
  //   }

  //   if (transaction.asset.votes && transaction.asset.votes.length > constants.maximumVotes) {
  //     return cb('Voting limit exceeded. Maximum is '+constants.maximumVotes+' vote per transaction')
  //   }

  //   modules.delegates.checkConfirmedDelegates(transaction.senderPublicKey, transaction.asset.votes, function (err) {
  //     if (err && exceptions.votes.indexOf(transaction.id) > -1) {
  //       library.logger.debug(err)
  //       library.logger.debug(JSON.stringify(trs))
  //       err = null
  //     }
  //     return cb(err, trs)
  //   })
  // }
}

module.exports = new TransactionValidator()
