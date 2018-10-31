const { TRANSACTION_TYPES } = require('../../../../constants')
const engine = require('../../../engine')

module.exports = (transaction) => {
  const { error, value } = engine.validate(transaction, engine.joi.object({
    id: engine.joi.string().alphanum().required(),
    blockid: engine.joi.number().unsafe(),
    type: engine.joi.number().valid(TRANSACTION_TYPES.SECOND_SIGNATURE),
    timestamp: engine.joi.number().integer().min(0).required(),
    amount: engine.joi.alternatives().try(engine.joi.bignumber(), engine.joi.number().valid(0)),
    fee: engine.joi.alternatives().try(engine.joi.bignumber(), engine.joi.number().integer().positive().required()),
    senderId: engine.joi.arkAddress(),
    senderPublicKey: engine.joi.arkPublicKey().required(),
    signature: engine.joi.string().alphanum().required(),
    signatures: engine.joi.array(),
    secondSignature: engine.joi.empty(),
    asset: engine.joi.object({
      signature: engine.joi.object({
        publicKey: engine.joi.arkPublicKey().required()
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
