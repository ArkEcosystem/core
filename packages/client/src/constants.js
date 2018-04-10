const path = require('path')

const configMainnet = require('./networks/ark/mainnet.js')
const configDevnet = require('./networks/ark/devnet.js')
const configTestnet = require('./networks/ark/testnet.js')

/**
 * [ARKTOSHI description]
 * @type {[type]}
 */
exports.ARKTOSHI = Math.pow(10, 8)

/**
 * [TRANSACTION_TYPES description]
 * @type {[type]}
 */
exports.TRANSACTION_TYPES = Object.freeze({
  TRANSFER: 0,
  SECOND_SIGNATURE: 1,
  DELEGATE: 2,
  VOTE: 3,
  MULTI_SIGNATURE: 4,
  IPFS: 5,
  TIMELOCK_TRANSFER: 6,
  MULTI_PAYMENT: 7,
  DELEGATE_RESIGNATION: 8
})

/**
 * [CONFIGURATIONS description]
 * @type {[type]}
 */
exports.CONFIGURATIONS = Object.freeze({
  ARK: {
    MAINNET: configMainnet,
    DEVNET: configDevnet,
    TESTNET: configTestnet
  }
})
