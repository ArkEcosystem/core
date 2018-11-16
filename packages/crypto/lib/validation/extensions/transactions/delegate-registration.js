const { TRANSACTION_TYPES } = require('../../../constants')
const transaction = require('./base')

module.exports = joi => ({
  name: 'arkDelegateRegistration',
  base: transaction(joi).append({
    type: joi.number().valid(TRANSACTION_TYPES.DELEGATE_REGISTRATION),
    amount: joi.alternatives().try(
      joi.bignumber(),
      joi
        .number()
        .valid(0)
        .required(),
    ),
    asset: joi
      .object({
        delegate: joi
          .object({
            username: joi.arkUsername().required(),
            publicKey: joi.arkPublicKey(),
          })
          .required(),
      })
      .required(),
    recipientId: joi.empty(),
  }),
})
