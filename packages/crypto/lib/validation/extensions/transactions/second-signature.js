const { TRANSACTION_TYPES } = require('../../../constants')
const transaction = require('./base')

module.exports = joi => ({
  name: 'arkSecondSignature',
  base: transaction(joi).append({
    type: joi
      .number()
      .only(TRANSACTION_TYPES.SECOND_SIGNATURE)
      .required(),
    amount: joi
      .alternatives()
      .try(joi.bignumber().only(0), joi.number().only(0))
      .optional(),
    secondSignature: joi.string().only(''),
    asset: joi
      .object({
        signature: joi
          .object({
            publicKey: joi.arkPublicKey().required(),
          })
          .required(),
      })
      .required(),
    recipientId: joi.empty(),
  }),
})
