const { crypto } = require('@arkecosystem/crypto')
const handleOutput = require('../utils/handle-output')

module.exports = opts => {
  let output

  if (opts.type === 'passphrase') {
    const keys = crypto.getKeys(opts.data)
    output = {
      passphrase: opts.data,
      publicKey: keys.publicKey,
      privateKey: keys.privateKey,
      address: crypto.getAddress(keys.publicKey, opts.network)
    }
  } else if (opts.type === 'privateKey') {
    const keys = crypto.getKeysByPrivateKey(opts.data)
    output = {
      publicKey: keys.publicKey,
      privateKey: keys.privateKey,
      address: crypto.getAddress(keys.publicKey, opts.network)
    }
  } else if (opts.type === 'publicKey') {
    output = {
      publicKey: opts.data,
      address: crypto.getAddress(opts.data, opts.network)
    }
  }

  return handleOutput(opts, output)
}
