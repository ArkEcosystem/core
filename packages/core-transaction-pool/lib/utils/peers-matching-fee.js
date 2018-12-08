const app = require('@arkecosystem/core-container')

const { dynamicFeeManager } = require('@arkecosystem/crypto')
const { TRANSACTION_TYPES } = require('../../../crypto/lib/constants')

/**
 * Search for peers that will accept the transaction
 * @param {Transaction} tx - Transaction to search matching peers' fee
 * @return {Object}
 */
module.exports = tx => {
  try {
    const p2p = app.resolvePlugin('p2p')
    const txType = TRANSACTION_TYPES.toString(tx.type).toUpperCase()
    const fee = +tx.fee.toFixed()
    const allPeers = p2p.getPeers()
    const matchingPeers = allPeers.filter(peer => {
      if (
        typeof peer.fees === 'object' &&
        typeof peer.fees.minFeePool === 'number' &&
        typeof peer.fees.addonBytes === 'object'
      ) {
        const addonBytes =
          peer.fees.addonBytes[
            Object.keys(peer.fees.addonBytes).find(
              k => k.toUpperCase() === txType,
            )
          ]
        const peerMinFee = dynamicFeeManager.calculateFee(
          peer.fees.minFeePool,
          tx,
          addonBytes,
        )

        if (fee >= peerMinFee) {
          return true
        }
      }

      return false
    })

    return matchingPeers
  } catch (error) {
    return false
  }
}
