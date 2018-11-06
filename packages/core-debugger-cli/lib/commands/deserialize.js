const { models: { Block, Transaction } } = require('@arkecosystem/crypto')
const handleOutput = require('../utils/handle-output')

module.exports = opts => {
  let deserialized

  if (opts.type === 'transaction') {
    deserialized = new Transaction(opts.data)
  } else {
    deserialized = new Block(opts.data)
  }

  return handleOutput(opts, JSON.stringify(deserialized, null, 4))
}
