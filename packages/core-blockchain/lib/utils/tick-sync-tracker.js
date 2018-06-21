const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const database = container.resolvePlugin('database')

let tracker = null

module.exports = async block => {
  if (!tracker) {
    const { height } = await database.blocks.getLastHeight()

    tracker = {
      start: new Date().getTime(),
      networkHeight: container.resolvePlugin('p2p').getMonitor().getNetworkHeight(),
      downloadedBlocks: height,
      blockPerSecond: 0,
      percent: 0,
      secondsLeft: 0
    }
  }

  tracker.downloadedBlocks = block.data.height
  tracker.percent = (tracker.downloadedBlocks * 100) / tracker.networkHeight
  tracker.blockPerSecond = ((new Date().getTime()) - tracker.start) / 1000 / tracker.downloadedBlocks
  tracker.secondsLeft = (tracker.networkHeight - tracker.downloadedBlocks) / tracker.blockPerSecond

  if (tracker.percent < 100) {
    const downloadedBlocks = tracker.downloadedBlocks.toLocaleString()
    const networkHeight = tracker.networkHeight.toLocaleString()

    logger.printTracker('Fast Sync', tracker.percent, 100, `(${downloadedBlocks} of ${networkHeight} blocks)`)
  } else {
    tracker = null
    logger.stopTracker('Fast Sync', 100, 100)
  }
}
