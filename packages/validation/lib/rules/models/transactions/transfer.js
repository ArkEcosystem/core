const { TRANSACTION_TYPES } = require('../../../constants')
const engine = require('../../../engine')

module.exports = (transaction) => {
  const { error, value } = engine.validate(transaction, engine.joi.object({
    id: engine.joi.string().alphanum().required(),
    blockid: engine.joi.number(),
    type: engine.joi.number().valid(TRANSACTION_TYPES.TRANSFER),
    timestamp: engine.joi.number().min(0).required(),
    amount: engine.joi.number().min(1).required(),
    fee: engine.joi.number().min(1).required(),
    senderId: engine.joi.phantomAddress(),
    recipientId: engine.joi.phantomAddress().required(),
    senderPublicKey: engine.joi.phantomPublicKey().required(),
    signature: engine.joi.string().alphanum().required(),
    signatures: engine.joi.array(),
    secondSignature: engine.joi.string().alphanum(),
    confirmations: engine.joi.number().min(0)
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
