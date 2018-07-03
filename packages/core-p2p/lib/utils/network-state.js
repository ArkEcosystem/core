'use strict'
const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const logger = container.resolvePlugin('logger')
const { slots } = require('@arkecosystem/crypto')

/**
 * Returns current network state. Peers are update before the call
 * @param {Monitor} p2pMonitor
 * @private {Block} lastBlock
 * @returns {Object} network state structure
 */
module.exports = (p2pMonitor, lastBlock) => {
  const peers = p2pMonitor.getPeers()
  const minimumNetworkReach = config.peers.minimumNetworkReach || 20
  const currentSlot = slots.getSlotNumber()

  let quorum = 0
  let noquorum = 0
  let overHeightQuorum = 0
  let overHeightBlockHeader = null

  if (process.env.ARK_ENV === 'test') {
    return {quorum: 1, forgingAllowed: true, nodeHeight: lastBlock.data.height, lastBlockId: lastBlock.data.id, overHeightBlockHeader: overHeightBlockHeader, minimumNetworkReach: true}
  }

  if (peers.length < minimumNetworkReach) {
    logger.info(`Network reach is not sufficient to get quorum. Network reach of ${peers.length} peers.`)
    return {quorum: 0, forgingAllowed: true, nodeHeight: lastBlock.data.height, lastBlockId: lastBlock.data.id, overHeightBlockHeader: overHeightBlockHeader, minimumNetworkReach: false}
  }

  for (const peer of peers) {
    if (peer.state.height === lastBlock.data.height) {
      if (peer.state.header.id === lastBlock.data.id && peer.state.currentSlot === currentSlot && peer.state.forgingAllowed) {
        quorum = quorum + 1
      } else {
        noquorum = noquorum + 1
      }
    } else if (peer.state.height > lastBlock.data.height) {
      noquorum = noquorum + 1
      overHeightQuorum = overHeightQuorum + 1
      overHeightBlockHeader = peer.state.header
    } else if (lastBlock.data.height - peer.state.height < 3) { // suppose the max network elasticity accross 3 blocks
      noquorum = noquorum + 1
    }
  }

  const calculatedQuorum = quorum / (quorum + noquorum)

  logger.debug(`Node height: ${lastBlock.data.height}, CalcQuorum: ${calculatedQuorum}, Quorum: ${quorum}, NQuorum: ${noquorum}, OverHeightQuorum: ${overHeightQuorum} Last Block id: ${lastBlock.data.id}`)

  return {quorum: calculatedQuorum, forgingAllowed: calculatedQuorum > 0.66, nodeHeight: lastBlock.data.height, lastBlockId: lastBlock.data.id, overHeightBlockHeader: overHeightBlockHeader, minimumNetworkReach: true}
}
