const path = require('path')

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
    MAINNET: path.resolve(__dirname, 'networks/ark/mainnet.js'),
    DEVNET: path.resolve(__dirname, 'networks/ark/devnet.js'),
    TESTNET: path.resolve(__dirname, 'networks/ark/testnet.js')
  }
})
