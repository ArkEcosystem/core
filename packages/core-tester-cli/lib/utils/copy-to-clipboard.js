const clipboardy = require('clipboardy')
const logger = require('./logger')

module.exports = (transactions) => {
  transactions.forEach(transaction => {
    transaction.serialized = transaction.serialized.toString('hex')
  })

  clipboardy.writeSync(JSON.stringify(transactions))
  logger.info(`Copied ${transactions.length} transactions`)
}
