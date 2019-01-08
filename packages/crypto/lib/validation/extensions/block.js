module.exports = joi => ({
  name: 'arkBlock',
  base: joi.object().keys({
    id: joi.arkBlockId().required(),
    idHex: joi.string().hex(),
    version: joi
      .number()
      .integer()
      .min(0),
    timestamp: joi
      .number()
      .integer()
      .min(0)
      .required(),
    previousBlock: joi.arkBlockId().required(),
    previousBlockHex: joi.string().hex(),
    height: joi
      .number()
      .integer()
      .positive()
      .required(),
    numberOfTransactions: joi
      .number()
      .integer()
      .only(joi.ref('transactions.length')),
    totalAmount: joi.alternatives().try(
      joi
        .number()
        .integer()
        .min(0)
        .required(),
      joi
        .string()
        .regex(/[0-9]+/)
        .required(),
    ),
    totalFee: joi
      .number()
      .integer()
      .min(0)
      .required(),
    reward: joi
      .number()
      .integer()
      .min(0)
      .required(),
    payloadLength: joi
      .number()
      .integer()
      .min(0),
    payloadHash: joi.string().hex(),
    generatorPublicKey: joi
      .string()
      .hex()
      .length(66)
      .required(),
    blockSignature: joi
      .string()
      .hex()
      .required(),
    transactions: joi.arkTransactions(),
  }),
})
