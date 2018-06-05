const { TRANSACTION_TYPES } = require('../../../constants')
const engine = require('../../../engine')

module.exports = (transaction) => {
  const { error, value } = engine.validate(transaction, engine.joi.object({
    id: engine.joi.string().alphanum().required(),
    blockid: engine.joi.number(),
    type: engine.joi.number().valid(TRANSACTION_TYPES.MULTI_SIGNATURE),
    timestamp: engine.joi.number().min(0).required(),
    amount: engine.joi.number().valid(0),
    fee: engine.joi.number().min(1).required(),
    senderId: engine.joi.arkAddress(),
    recipientId: engine.joi.empty(),
    senderPublicKey: engine.joi.arkPublicKey().required(),
    signature: engine.joi.string().alphanum().required(),
    signatures: engine.joi.array().min(2).required(),
    secondSignature: engine.joi.string().alphanum(),
    asset: engine.joi.object({
      multisignature: engine.joi.object({
        min: engine.joi.number().min(1).max(Math.min(transaction.asset.multisignature.keysgroup.length, 16)).required(),
        keysgroup: engine.joi.array().items(
          engine.joi.string().length(67).regex(/^(\+|-)/).required()
        ).min(2).required(),
        lifetime: engine.joi.number().min(1).max(72).required()
      })
    }).required(),
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
