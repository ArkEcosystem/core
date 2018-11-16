const { TRANSACTION_TYPES } = require('../../../constants')
const transaction = require('./base')

module.exports = joi => ({
  name: 'arkMultiPayment',
  base: transaction(joi).append({
    type: joi
      .number()
      .only(TRANSACTION_TYPES.MULTI_PAYMENT)
      .required(),
    amount: joi
      .alternatives()
      .try(joi.bignumber(), joi.number().valid(0))
      .optional(),
    asset: joi.object().required(),
    recipientId: joi.empty(),
  }),
})
