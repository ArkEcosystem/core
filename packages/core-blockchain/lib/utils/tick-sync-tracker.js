const human = require('interval-to-human')
const { slots } = require('@arkecosystem/client')

const pluginManager = require('@arkecosystem/core-plugin-manager')
const logger = pluginManager.get('logger')
const config = pluginManager.get('config')

module.exports = (block) => {
  let synctracker = null

  const constants = config.getConstants(block.data.height)

  if (!synctracker) {
    synctracker = {
      starttimestamp: block.data.timestamp,
      startdate: new Date().getTime()
    }
  }

  const remainingtime = (slots.getTime() - block.data.timestamp) * (block.data.timestamp - synctracker.starttimestamp) / (new Date().getTime() - synctracker.startdate) / constants.blocktime
  const title = 'Fast Synchronisation'

  if (block.data.timestamp - slots.getTime() < 8) {
    logger.printTracker(title, block.data.timestamp, slots.getTime(), human(remainingtime), 3)
  } else {
    synctracker = null
    logger.stopTracker(title, slots.getTime(), slots.getTime())
  }
}
