const clipboardy = require('clipboardy')
const pluralize = require('pluralize')
const logger = require('./logger')

module.exports = transactions => {
  clipboardy.writeSync(JSON.stringify(transactions))
  logger.info(`Copied ${pluralize('transaction', transactions.length, true)}`)
}
