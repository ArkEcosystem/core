const { models: { Block, Transaction } } = require('@arkecosystem/crypto')
const handleOutput = require('../utils/handle-output')

module.exports = opts => {
  const deserialized = opts.type === 'transaction'
    ? new Transaction(opts.data)
    : Block.deserialize(opts.data)

  return handleOutput(opts, JSON.stringify(deserialized, null, 4))
}
