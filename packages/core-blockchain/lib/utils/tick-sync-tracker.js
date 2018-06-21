const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const database = container.resolvePlugin('database')

const prettyMs = require('pretty-ms')

let tracker = null

module.exports = async block => {
  if (!tracker) {
    const { height } = await database.blocks.getLastHeight()

    tracker = {
      start: new Date().getTime(),
      networkHeight: container.resolvePlugin('p2p').getMonitor().getNetworkHeight(),
      downloadedBlocks: height,
      blockPerMs: 0,
      percent: 0,
      secondsLeft: 0
    }
  }

  tracker.downloadedBlocks += 400
  tracker.percent = (tracker.downloadedBlocks * 100) / tracker.networkHeight
  tracker.blockPerMs = ((new Date().getTime()) - tracker.start) / tracker.downloadedBlocks
  tracker.msLeft = (tracker.networkHeight - tracker.downloadedBlocks) / tracker.blockPerMs

  if (tracker.percent < 100) {
    const downloadedBlocks = tracker.downloadedBlocks.toLocaleString()
    const networkHeight = tracker.networkHeight.toLocaleString()

    logger.printTracker('Fast Sync', tracker.percent, 100, `(${downloadedBlocks} of ${networkHeight} - ${prettyMs(tracker.msLeft, {secDecimalDigits: 0})})`)
  } else {
    tracker = null
    logger.stopTracker('Fast Sync', 100, 100)
  }
}
