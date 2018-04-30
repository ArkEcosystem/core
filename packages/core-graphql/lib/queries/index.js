const block = require('./block')
const transaction = require('./transaction')

module.exports = {
  ...block,
  ...transaction
}
