const { models: { Block, Transaction } } = require('@arkecosystem/crypto')
const copyToClipboard = require('../utils/copy-to-clipboard')

module.exports = opts => {
  const deserialized = opts.type === 'transaction'
    ? new Transaction(opts.data)
    : new Block(Block.deserialize(opts.data))

  const output = opts.type === 'transaction'
    ? deserialized.verify()
    : deserialized.verify().verified

  if (opts.copy) {
    return copyToClipboard(output)
  }

  if (opts.log) {
    return console.log(output)
  }

  return output
}
