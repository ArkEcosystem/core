const { TRANSACTION_TYPES } = require('../../../constants')
const transaction = require('./base')

module.exports = joi => ({
  name: 'arkDelegateResignation',
  base: transaction(joi).append({
    type: joi
      .number()
      .only(TRANSACTION_TYPES.DELEGATE_RESIGNATION)
      .required(),
    amount: joi
      .alternatives()
      .try(joi.bignumber().only(0), joi.number().valid(0))
      .optional(),
    asset: joi.object().required(),
    recipientId: joi.empty(),
  }),
})
