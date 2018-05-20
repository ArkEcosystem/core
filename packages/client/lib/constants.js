const configMainnet = require('./networks/ark/mainnet.json')
const configDevnet = require('./networks/ark/devnet.json')
const configTestnet = require('./networks/ark/testnet.json')

/**
 * The Arktoshi base.
 * @type {Number}
 */
exports.ARKTOSHI = Math.pow(10, 8)

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
  DELEGATE_RESIGNATION: 8
})

/**
 * Available network configurations.
 * @type {Object}
 */
exports.CONFIGURATIONS = Object.freeze({
  ARK: {
    MAINNET: configMainnet,
    DEVNET: configDevnet,
    TESTNET: configTestnet
  }
})

/**
 * Current transactions offsets. Used in dynamic fee price calculation.
 * @type {Object}
 */
exports.TRANSACTION_OFFSETS = Object.freeze({
  TRANSFER: 0,
  SECOND_SIGNATURE: 0,
  DELEGATE_REGISTRATION: 250,
  VOTE: 100,
  MULTI_SIGNATURE: 400,
  IPFS: 250,
  TIMELOCK_TRANSFER: 400,
  MULTI_PAYMENT: 400,
  DELEGATE_RESIGNATION: 400
})
