'use strict'

// const container = require('@arkecosystem/core-container')
// const blockchain = container.resolvePlugin('blockchain')
const client = require('@arkecosystem/client')
const { TRANSACTION_TYPES } = client.constants
// const addressRule = require('../lib/rules/address')
const transferRule = require('../lib/rules/models/transactions/transfer')
const signatureRule = require('../lib/rules/models/transactions/signature')
const delegateRule = require('../lib/rules/models/transactions/delegate')
const voteRule = require('../lib/rules/models/transactions/vote')
// const walletManager = blockchain.database.walletManager

module.exports = class TransactionValidator {
  validate (transaction) {
    if (transaction.type === TRANSACTION_TYPES.TRANSFER) {
      return this.__validateTransfer(transaction)
    }

    if (transaction.type === TRANSACTION_TYPES.SECOND_SIGNATURE) {
      return this.__validateSignature(transaction)
    }

    if (transaction.type === TRANSACTION_TYPES.DELEGATE_REGISTRATION) {
      return this.__validateDelegate(transaction)
    }

    if (transaction.type === TRANSACTION_TYPES.VOTE) {
      return this.__validateVote(transaction)
    }
  }

  __validateTransfer (transaction) {
    return transferRule(transaction).passes
  }

  __validateSignature (transaction) {
    return signatureRule(transaction).passes
  }

  __validateDelegate (transaction) {
    return delegateRule(transaction).passes
  }

  __validateVote (transaction) {
    return voteRule(transaction).passes
  }

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
