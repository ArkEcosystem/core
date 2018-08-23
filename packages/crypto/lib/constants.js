const configMainnet = require('./networks/phantom/mainnet.json')
const configDevnet = require('./networks/phantom/devnet.json')
const configTestnet = require('./networks/phantom/testnet.json')

/**
 * The Phantomtoshi base.
 * @type {Number}
 */
exports.PHANTOMTOSHI = 1e8

/**
 * Available transaction types.
 * @type {Object}
 */
exports.TRANSACTION_TYPES = Object.freeze({
  TRANSFER: 0,
  SECOND_SIGNATURE: 1,
  DELEGATE_REGISTRATION: 2,
  VOTE: 3,
  MULTI_SIGNATURE: 4,
  IPFS: 5,
  TIMELOCK_TRANSFER: 6,
  MULTI_PAYMENT: 7,
  DELEGATE_RESIGNATION: 8,
  toString(type) {
    switch (type) {
      case this.TRANSFER:
        return 'transfer'
      case this.SECOND_SIGNATURE:
        return 'second signature'
      case this.DELEGATE_REGISTRATION:
        return 'delegate registration'
      case this.VOTE:
        return 'vote'
      case this.MULTI_SIGNATURE:
        return 'multi signature'
      case this.IPFS:
        return 'ipfs'
      case this.TIMELOCK_TRANSFER:
        return 'timelock transfer'
      case this.MULTI_PAYMENT:
        return 'multi payment'
      case this.DELEGATE_RESIGNATION:
        return 'delegate resignation'
      default:
        throw new Error('Invalid transaction type')
    }
  },
})

/**
 * Available network configurations.
 * @type {Object}
 */
exports.CONFIGURATIONS = Object.freeze({
  PHANTOM: {
    MAINNET: configMainnet,
    DEVNET: configDevnet,
    TESTNET: configTestnet,
  },
})
