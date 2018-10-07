const { crypto, models: { Transaction } } = require('@arkecosystem/crypto')
const handleOutput = require('../utils/handle-output')

module.exports = opts => {
  const transaction = new Transaction(opts.data)
  const publicKey = opts.publicKey

  const output = crypto.verifySecondSignature(transaction, publicKey)
  return handleOutput(opts, output)
}
