const { TRANSACTION_TYPES } = require('../../../constants')
const transaction = require('./base')

module.exports = joi => ({
  name: 'arkMultiPayment',
  base: transaction(joi).append({
    type: joi.number().valid(TRANSACTION_TYPES.MULTI_PAYMENT),
    amount: joi.alternatives().try(joi.bignumber(), joi.number().valid(0)),
    asset: joi.object().required(),
    recipientId: joi.empty(),
  }),
})
