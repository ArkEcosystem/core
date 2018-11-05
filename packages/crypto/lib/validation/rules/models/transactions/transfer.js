const { TRANSACTION_TYPES } = require('../../../../constants')
const engine = require('../../../engine')

module.exports = (transaction) => {
  const { error, value } = engine.validate(transaction, engine.joi.object({
    id: engine.joi.string().alphanum().required(),
    blockid: engine.joi.number().unsafe(),
    type: engine.joi.number().valid(TRANSACTION_TYPES.TRANSFER),
    timestamp: engine.joi.number().integer().min(0).required(),
    amount: engine.joi.alternatives().try(engine.joi.bignumber(), engine.joi.number().integer().positive().required()),
    fee: engine.joi.alternatives().try(engine.joi.bignumber(), engine.joi.number().integer().positive().required()),
    senderId: engine.joi.arkAddress(),
    recipientId: engine.joi.arkAddress().required(),
    senderPublicKey: engine.joi.arkPublicKey().required(),
    signature: engine.joi.string().alphanum().required(),
    signatures: engine.joi.array(),
    secondSignature: engine.joi.string().alphanum(),
    vendorField: engine.joi.string().max(64),
    confirmations: engine.joi.number().integer().min(0)
  }), {
    allowUnknown: true
  })

  return {
    data: value,
    errors: error ? error.details : null,
    passes: !error,
    fails: error
  }
}
