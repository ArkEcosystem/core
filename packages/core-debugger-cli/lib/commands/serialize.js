const { models: { Block, Transaction } } = require('@arkecosystem/crypto')
const copyToClipboard = require('../utils/copy-to-clipboard')

module.exports = opts => {
  let serialized = opts.type === 'transaction'
    ? Transaction.serialize(JSON.parse(opts.data))
    : Block[opts.full ? 'serializeFull': 'serialize'](JSON.parse(opts.data))

  const output = serialized.toString('hex')

  if (opts.copy) {
    return copyToClipboard(output)
  }

  if (opts.log) {
    return console.log(output)
  }

  return output
}
