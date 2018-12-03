const Joi = require('joi').extend(
  require('../../../../lib/validation/extensions'),
)

const { constants, transactionBuilder } = require('../../../../lib')

const address = 'APnDzjtDb1FthuqcLMeL5XMWb1uD1KeMGi'
const fee = 1 * constants.ARKTOSHI
const amount = 10 * constants.ARKTOSHI

let transaction
beforeEach(() => {
  transaction = transactionBuilder.transfer()
})

describe('Transfer Transaction', () => {
  it('should be valid', () => {
    transaction
      .recipientId(address)
      .amount(amount)
      .sign('passphrase')
    expect(
      Joi.validate(transaction.getStruct(), Joi.arkTransfer()).error,
    ).toBeNull()
  })

  it('should be valid with correct data', () => {
    transaction
      .recipientId(address)
      .amount(amount)
      .fee(fee)
      .vendorField('Ahoy')
      .sign('passphrase')
    expect(
      Joi.validate(transaction.getStruct(), Joi.arkTransfer()).error,
    ).toBeNull()
  })

  it('should be valid with up to 64 bytes in vendor field', () => {
    transaction
      .recipientId(address)
      .amount(amount)
      .fee(fee)
      .vendorField('a'.repeat(64))
      .sign('passphrase')
    expect(
      Joi.validate(transaction.getStruct(), Joi.arkTransfer()).error,
    ).toBeNull()

    transaction
      .recipientId(address)
      .amount(amount)
      .fee(fee)
      .vendorField('⊁'.repeat(21))
      .sign('passphrase')
    expect(
      Joi.validate(transaction.getStruct(), Joi.arkTransfer()).error,
    ).toBeNull()
  })

  it('should be invalid with more than 64 bytes in vendor field', () => {
    transaction
      .recipientId(address)
      .amount(amount)
      .fee(fee)
      .vendorField('a'.repeat(65))
      .sign('passphrase')
    expect(
      Joi.validate(transaction.getStruct(), Joi.arkTransfer()).error,
    ).not.toBeNull()

    transaction
      .recipientId(address)
      .amount(amount)
      .fee(fee)
      .vendorField('⊁'.repeat(22))
      .sign('passphrase')
    expect(
      Joi.validate(transaction.getStruct(), Joi.arkTransfer()).error,
    ).not.toBeNull()
  })

  it('should be invalid due to no transaction as object', () => {
    expect(Joi.validate('test', Joi.arkTransfer()).error).not.toBeNull()
  })

  it('should be invalid due to no address', () => {
    transaction
      .recipientId(null)
      .amount(amount)
      .sign('passphrase')
    expect(
      Joi.validate(transaction.getStruct(), Joi.arkTransfer()).error,
    ).not.toBeNull()
  })

  it('should be invalid due to invalid address', () => {
    transaction
      .recipientId(address)
      .amount(amount)
      .sign('passphrase')
    const struct = transaction.getStruct()
    struct.recipientId = 'woop'
    expect(Joi.validate(struct, Joi.arkTransfer()).error).not.toBeNull()
  })

  it('should be invalid due to zero amount', () => {
    transaction
      .recipientId(address)
      .amount(0)
      .sign('passphrase')
    expect(
      Joi.validate(transaction.getStruct(), Joi.arkTransfer()).error,
    ).not.toBeNull()
  })

  it('should be invalid due to zero fee', () => {
    transaction
      .recipientId(address)
      .amount(0)
      .fee(0)
      .sign('passphrase')
    expect(
      Joi.validate(transaction.getStruct(), Joi.arkTransfer()).error,
    ).not.toBeNull()
  })

  it('should be invalid due to wrong transaction type', () => {
    transaction = transactionBuilder.delegateRegistration()
    transaction.usernameAsset('delegate_name').sign('passphrase')
    expect(
      Joi.validate(transaction.getStruct(), Joi.arkTransfer()).error,
    ).not.toBeNull()
  })
})
