const container = require('@arkecosystem/core-container')

const config = container.resolvePlugin('config')

const { slots } = require('@arkecosystem/crypto')

/**
 * Returns current network state. Peers are update before the call
 * @param {Monitor} monitor
 * @private {Block} lastBlock
 * @returns {Object} JSON response for the forger to assess if allowed to forge or not
 */
module.exports = (monitor, lastBlock) => {
  const createStateObject = (
    quorum,
    minimumNetworkReach,
    coldStart,
    overHeightBlockHeader,
  ) => ({
    quorum,
    nodeHeight: lastBlock.data.height,
    lastBlockId: lastBlock.data.id,
    overHeightBlockHeader,
    minimumNetworkReach,
    coldStart,
  })

  const peers = monitor.getPeers()
  const minimumNetworkReach = config.peers.minimumNetworkReach || 20
  const currentSlot = slots.getSlotNumber()

  let quorum = 0
  let noQuorum = 0
  let overHeightQuorum = 0
  let overHeightBlockHeader = null

  if (monitor.__isColdStartActive()) {
    return createStateObject(0, true, true, overHeightBlockHeader)
  }

  if (process.env.ARK_ENV === 'test') {
    return createStateObject(1, true, false, overHeightBlockHeader)
  }

  if (peers.length < minimumNetworkReach) {
    return createStateObject(0, false, false, overHeightBlockHeader)
  }

  for (const peer of peers) {
    if (peer.state.height === lastBlock.data.height) {
      if (
        peer.state.header.id === lastBlock.data.id
        && peer.state.currentSlot === currentSlot
        && peer.state.forgingAllowed
      ) {
        quorum += 1
      } else {
        noQuorum += 1
      }
    } else if (peer.state.height > lastBlock.data.height) {
      noQuorum += 1
      overHeightQuorum += 1
      overHeightBlockHeader = peer.state.header
    } else if (lastBlock.data.height - peer.state.height < 3) {
      // suppose the max network elasticity accross 3 blocks
      noQuorum += 1
    }
  }

  const calculatedQuorum = quorum / (quorum + noQuorum)

  return createStateObject(calculatedQuorum, true, false, overHeightBlockHeader)
}
