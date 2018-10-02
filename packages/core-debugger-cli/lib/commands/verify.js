const { models: { Block, Transaction } } = require('@arkecosystem/crypto')
const handleOutput = require('../utils/handle-output')

module.exports = opts => {
  const deserialized = opts.type === 'transaction'
    ? new Transaction(opts.data)
    : new Block(Block.deserialize(opts.data))

  const output = opts.type === 'transaction'
    ? deserialized.verify()
    : deserialized.verify().verified

  return handleOutput(opts, output)
}
