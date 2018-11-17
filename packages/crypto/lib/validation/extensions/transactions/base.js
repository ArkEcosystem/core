const { TRANSACTION_TYPES } = require('../../../constants')

module.exports = joi =>
  joi.object().keys({
    id: joi
      .string()
      .alphanum()
      .required(),
    blockid: joi.number().unsafe(), // TODO: remove in 2.1
    timestamp: joi
      .number()
      .integer()
      .min(0)
      .required(),
    amount: joi.alternatives().try(
      joi.bignumber(),
      joi
        .number()
        .integer()
        .positive()
        .required(),
    ),
    fee: joi.alternatives().try(
      joi.bignumber().required(),
      joi
        .number()
        .integer()
        .positive()
        .required(),
      joi
        .string()
        .regex(/[0-9]+/)
        .required(),
    ),
    senderId: joi.arkAddress(), // TODO: remove in 2.1
    recipientId: joi.arkAddress().required(),
    senderPublicKey: joi.arkPublicKey().required(),
    signature: joi
      .string()
      .alphanum()
      .required(),
    signatures: joi.array(),
    secondSignature: joi.string().alphanum(),
    confirmations: joi // TODO: remove in 2.1
      .number()
      .integer()
      .min(0),
  })
