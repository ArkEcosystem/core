const { TRANSACTION_TYPES } = require('../../../../constants')
const engine = require('../../../engine')

module.exports = (transaction) => {
  let maxMinValue = 16
  let signaturesLength = 2
  if (transaction.asset && transaction.asset.multisignature && Array.isArray(transaction.asset.multisignature.keysgroup)) {
    maxMinValue = transaction.asset.multisignature.keysgroup.length
    signaturesLength = maxMinValue
  }
  const { error, value } = engine.validate(transaction, engine.joi.object({
    id: engine.joi.string().alphanum().required(),
    blockid: engine.joi.number().unsafe(),
    type: engine.joi.number().valid(TRANSACTION_TYPES.MULTI_SIGNATURE),
    timestamp: engine.joi.number().integer().min(0).required(),
    amount: engine.joi.alternatives().try(engine.joi.bignumber(), engine.joi.number().valid(0)),
    fee: engine.joi.alternatives().try(engine.joi.bignumber(), engine.joi.number().integer().positive().required()),
    senderId: engine.joi.arkAddress(),
    recipientId: engine.joi.empty(),
    senderPublicKey: engine.joi.arkPublicKey().required(),
    signature: engine.joi.string().alphanum().required(),
    signatures: engine.joi.array().length(signaturesLength).required(),
    secondSignature: engine.joi.string().alphanum(),
    asset: engine.joi.object({
      multisignature: engine.joi.object({
        min: engine.joi.number().integer().positive().max(Math.min(maxMinValue, 16)).required(),
        keysgroup: engine.joi.array().unique().min(2).items(
          engine.joi.string().not(`+${transaction.senderPublicKey}`).length(67).regex(/^\+/).required()
        ).required(),
        lifetime: engine.joi.number().integer().min(1).max(72).required()
      }).required()
    }).required(),
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
