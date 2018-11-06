const { models: { Block, Transaction } } = require('@arkecosystem/crypto')
const handleOutput = require('../utils/handle-output')

module.exports = opts => {
  let serialized = opts.type === 'transaction'
    ? Transaction.serialize(JSON.parse(opts.data))
    : Block[opts.full ? 'serializeFull' : 'serialize'](JSON.parse(opts.data))

  return handleOutput(opts, serialized.toString('hex'))
}
