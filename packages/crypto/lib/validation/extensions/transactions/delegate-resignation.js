const { TRANSACTION_TYPES } = require('../../../constants')
const transaction = require('./base')

module.exports = joi => ({
  name: 'arkDelegateResignation',
  base: transaction(joi).append({
    type: joi.number().valid(TRANSACTION_TYPES.DELEGATE_RESIGNATION),
    amount: joi.alternatives().try(joi.bignumber(), joi.number().valid(0)),
    asset: joi.object().required(),
    recipientId: joi.empty(),
  }),
})
