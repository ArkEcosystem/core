const prettyMs = require('pretty-ms')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const database = container.resolvePlugin('database')

let tracker = null

module.exports = async blockCount => {
  if (!tracker) {
    const { count } = await database.blocks.count()

    tracker = {
      start: new Date().getTime(),
      networkHeight: container.resolvePlugin('p2p').getMonitor().getNetworkHeight(),
      blocksInitial: count,
      blocksDownloaded: count,
      blocksSession: 0,
      blocksPerMillisecond: 0,
      percent: 0,
      timeLeft: 0
    }
  }

  // The total amount of downloaded blocks equals the current height
  tracker.blocksDownloaded += blockCount

  // The total amount of downloaded blocks downloaded since start of the current session
  tracker.blocksSession = tracker.blocksDownloaded - tracker.blocksInitial

  // The percentage of total blocks that is left to be downloaded
  tracker.percent = (tracker.blocksDownloaded * 100) / tracker.networkHeight

  // The number of blocks the node can download per millisecond
  const diffSinceStart = new Date().getTime() - tracker.start
  tracker.blocksPerMillisecond = tracker.blocksSession / diffSinceStart

  // The time left to download the missing blocks in milliseconds
  tracker.timeLeft = Math.trunc((tracker.networkHeight - tracker.blocksDownloaded) / tracker.blocksPerMillisecond)

  if (tracker.percent < 100 && isFinite(tracker.timeLeft)) {
    const blocksDownloaded = tracker.blocksDownloaded.toLocaleString()
    const networkHeight = tracker.networkHeight.toLocaleString()
    const timeLeft = prettyMs(tracker.timeLeft, { secDecimalDigits: 0 })

    logger.printTracker('Fast Sync', tracker.percent, 100, `(${blocksDownloaded} of ${networkHeight} blocks - Est. ${timeLeft})`)
  }

  if (tracker.percent === 100) {
    tracker = null
    logger.stopTracker('Fast Sync', 100, 100)
  }
}
