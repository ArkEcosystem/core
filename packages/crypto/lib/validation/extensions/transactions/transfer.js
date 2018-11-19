const { TRANSACTION_TYPES } = require('../../../constants')
const transaction = require('./base')

module.exports = joi => ({
  name: 'arkTransfer',
  base: transaction(joi).append({
    type: joi
      .number()
      .only(TRANSACTION_TYPES.TRANSFER)
      .required(),
    expiration: joi
      .number()
      .integer()
      .min(0),
    vendorField: joi
      .string()
      .max(64, 'utf8')
      .allow('', null)
      .optional(), // TODO: remove in 2.1
    vendorFieldHex: joi
      .string()
      .max(64, 'hex')
      .optional(),
    asset: joi.object().empty(),
  }),
})
