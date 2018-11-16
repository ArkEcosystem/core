const { TRANSACTION_TYPES } = require('../../../constants')
const transaction = require('./base')

module.exports = joi => ({
  name: 'arkTransfer',
  base: transaction(joi).append({
    type: joi
      .number()
      .only(TRANSACTION_TYPES.TRANSFER)
      .required(),
    vendorField: joi
      .string()
      .max(64, 'utf8')
      .optional(), // TODO: remove in 2.1 for vendorFieldHex
    asset: joi
      .object()
      .empty()
      .optional(),
  }),
})
