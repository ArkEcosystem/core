const Joi = require('joi')
const validate = require('../utils/validate-with-joi')

module.exports = (transaction) => {
  const { error, value } = validate(transaction, Joi.object({
    id: Joi.string().alphanum().required(),
    blockid: Joi.number(),
    type: Joi.number().valid(1),
    timestamp: Joi.number().min(0).required(),
    amount: Joi.number().valid(0),
    fee: Joi.number().min(1).required(),
    senderId: Joi.string().alphanum().length(34).required(),
    senderPublicKey: Joi.string().alphanum().length(66).required(),
    signature: Joi.string().alphanum().required(),
    asset: Joi.object({
      signature: Joi.object({
        publicKey: Joi.string().alphanum().length(66).required()
      })
    }).required(),
    confirmations: Joi.number().min(0)
  }))

  return {
    data: value,
    passes: !error,
    fails: error
  }
}
