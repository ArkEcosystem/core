const clipboardy = require('clipboardy')
const logger = require('./logger')

module.exports = (transactions) => {
  clipboardy.writeSync(JSON.stringify(transactions))
  logger.info(`Copied ${transactions.length} transactions`)
}
