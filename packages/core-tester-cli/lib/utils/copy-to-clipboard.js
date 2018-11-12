const clipboardy = require('clipboardy')
const logger = require('./logger')
const pluralize = require('pluralize')

module.exports = transactions => {
  clipboardy.writeSync(JSON.stringify(transactions))
  logger.info(`Copied ${pluralize('transaction', transactions.length, true)}`)
}
