const {
  crypto,
  models: { Transaction },
} = require('@phantomchain/crypto')
const handleOutput = require('../utils/handle-output')

module.exports = opts => {
  const transaction = new Transaction(opts.data)
  const publicKey = opts.publicKey

  const output = crypto.verifySecondSignature(transaction, publicKey)
  return handleOutput(opts, output)
}
