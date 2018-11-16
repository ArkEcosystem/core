const { TRANSACTION_TYPES } = require('../../../constants')
const transaction = require('./base')

module.exports = joi => ({
  name: 'arkSecondSignature',
  base: transaction(joi).append({
    type: joi.number().valid(TRANSACTION_TYPES.SECOND_SIGNATURE),
    amount: joi.alternatives().try(joi.bignumber(), joi.number().valid(0)),
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
