const { TRANSACTION_TYPES } = require('../../../constants')
const transaction = require('./base')

module.exports = joi => ({
  name: 'arkIpfs',
  base: transaction(joi).append({
    type: joi
      .number()
      .only(TRANSACTION_TYPES.IPFS)
      .required(),
    amount: joi
      .alternatives()
      .try(joi.bignumber().only(0), joi.number().valid(0))
      .optional(),
    asset: joi.object().required(),
    recipientId: joi.empty(),
  }),
})
