const prettyMs = require('pretty-ms')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const database = container.resolvePlugin('database')

let tracker = null

module.exports = async block => {
  const { height } = await database.blocks.getLastHeight()
  if (!tracker) {

    tracker = {
      start: new Date().getTime(),
      networkHeight: container.resolvePlugin('p2p').getMonitor().getNetworkHeight(),
      downloadedBlocks: height,
      blockPerMs: 0,
      percent: 0,
      timeLeft: 0
    }
  }

  tracker.percent = (height * 100) / tracker.networkHeight
  tracker.blockPerMs = (new Date().getTime()) - tracker.start) / (height - tracker.downloadedBlocks)
  tracker.timeLeft = Math.abs((tracker.networkHeight - height) / tracker.blockPerMs)

  if (tracker.percent < 100 && isFinite(tracker.timeLeft)) {
    const downloadedBlocks = tracker.downloadedBlocks.toLocaleString()
    const networkHeight = tracker.networkHeight.toLocaleString()
    const timeLeft = prettyMs(tracker.timeLeft, { secDecimalDigits: 0 })

    logger.printTracker('Fast Sync', tracker.percent, 100, `(${downloadedBlocks} of ${networkHeight} blocks - Est. ${timeLeft})`)
  }

  if (tracker.percent === 100) {
    tracker = null
    logger.stopTracker('Fast Sync', 100, 100)
  }
}
