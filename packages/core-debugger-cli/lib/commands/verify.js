const { models: { Block, Transaction } } = require('@arkecosystem/crypto')
const copyToClipboard = require('../utils/copy-to-clipboard')

module.exports = opts => {
  const deserialized = opts.type === 'transaction'
    ? new Transaction(opts.data)
    : new Block(Block.deserialize(opts.data))

  const output = deserialized.verify()

  if (opts.copy) {
    return copyToClipboard(output)
  }

  if (opts.log) {
    return console.log(output)
  }

  return output
}
