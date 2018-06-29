'use strict'
const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const blockchain = container.resolvePlugin('blockchain')
const logger = container.resolvePlugin('logger')
const { slots } = require('@arkecosystem/crypto')

module.exports = class PBFTForger {
  /**
   * Checks minimum network reach
   * @return {Promise}
   */
  async checkMinimimNetworkReach () {
    const minimumNetworkReach = config.peers.minimumNetworkReach || 20
    const peers = blockchain.p2p.getPeers()

    if (peers.length < minimumNetworkReach && process.env.ARK_ENV !== 'test') {
      logger.info(`Network reach is not sufficient to get quorum. Network reach of ${peers.length} peers.`)
      return false
    }

    return true
  }

  async calculateQuorum () {
    const lastBlock = blockchain.getLastBlock()
    const networkHeight = await blockchain.p2p.getNetworkHeight()
    const peers = blockchain.p2p.getPeers()

    const currentSlot = slots.getSlotNumber();

    let quorum = 0
    let noquorum = 0
    let maxheight = lastBlock.height
    let overheightquorum = 0
    let overheightblock = null
    let letsforge = false

    for (const peer of peers) {
      if (peer.height === lastBlock.height) {
        if (peer.blockheader.id === lastBlock.id && peer.currentSlot === currentSlot && peer.forgingAllowed) {
          quorum = quorum + 1
        } else {
          noquorum = noquorum + 1
        }
      } else if (peer.height > lastBlock.height) {
        maxheight = peer.height
        noquorum = noquorum + 1
        // overheightquorum = overheightquorum + 1;
        // overheightblock = peer.blockheader;
      } else if (lastBlock.height - peer.height < 3) { // suppose the max network elasticity accross 3 blocks
        noquorum = noquorum + 1
      }
    }
    // PBFT: most nodes are on same branch, no other block have been forged and we are on forgeable currentSlot
    const calculatedQuorum = quorum / (quorum + noquorum)
    if (calculatedQuorum > 0.66) {
        letsforge = true
    } else {
      // We are forked!
      logger.info(`Fork 6 - Not enough quorum to forge next block. Network height: ${networkHeight}, Quorum: ${calculatedQuorum}, Last Block id: `)
    }
  }
}
