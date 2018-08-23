const { TRANSACTION_TYPES } = require('../../../constants')
const transaction = require('./base')

module.exports = joi => ({
  name: 'phantomDelegateRegistration',
  base: transaction(joi).append({
    type: joi
      .number()
      .only(TRANSACTION_TYPES.DELEGATE_REGISTRATION)
      .required(),
    amount: joi
      .alternatives()
      .try(joi.bignumber().only(0), joi.number().only(0))
      .optional(),
    asset: joi
      .object({
        delegate: joi
          .object({
            username: joi.phantomUsername().required(),
            publicKey: joi.phantomPublicKey(),
          })
          .required(),
      })
      .required(),
    recipientId: joi.empty(),
  }),
})
