/* eslint no-empty: "off" */

const Joi = require('joi').extend(
  require('../../../../lib/validation/extensions'),
)

const { constants, transactionBuilder } = require('../../../../lib')

let transaction
beforeEach(() => {
  transaction = transactionBuilder.delegateRegistration()
})

describe('Delegate Registration Transaction', () => {
  it('should be valid', () => {
    transaction.usernameAsset('delegate1').sign('passphrase')

    expect(
      Joi.validate(transaction.getStruct(), Joi.arkDelegateRegistration())
        .error,
    ).toBeNull()
  })

  it('should be invalid due to no transaction as object', () => {
    expect(
      Joi.validate('test', Joi.arkDelegateRegistration()).error,
    ).not.toBeNull()
  })

  it('should be invalid due to non-zero amount', () => {
    transaction
      .usernameAsset('delegate1')
      .amount(10 * constants.ARKTOSHI)
      .sign('passphrase')

    expect(
      Joi.validate(transaction.getStruct(), Joi.arkDelegateRegistration())
        .error,
    ).not.toBeNull()
  })

  it('should be invalid due to space in username', () => {
    transaction.usernameAsset('test 123').sign('passphrase')

    expect(
      Joi.validate(transaction.getStruct(), Joi.arkDelegateRegistration())
        .error,
    ).not.toBeNull()
  })

  it('should be invalid due to non-alphanumeric in username', () => {
    transaction.usernameAsset('£££').sign('passphrase')

    expect(
      Joi.validate(transaction.getStruct(), Joi.arkDelegateRegistration())
        .error,
    ).not.toBeNull()
  })

  it('should be invalid due to username too long', () => {
    transaction.usernameAsset('1234567890123456789012345').sign('passphrase')

    expect(
      Joi.validate(transaction.getStruct(), Joi.arkDelegateRegistration())
        .error,
    ).not.toBeNull()
  })

  it('should be invalid due to undefined username', () => {
    try {
      transaction.usernameAsset(undefined).sign('passphrase')
      expect(
        Joi.validate(transaction.getStruct(), Joi.arkDelegateRegistration())
          .error,
      ).not.toBeNull()
    } catch (error) {}
  })

  it('should be invalid due to no username', () => {
    transaction.usernameAsset('').sign('passphrase')

    expect(
      Joi.validate(transaction.getStruct(), Joi.arkDelegateRegistration())
        .error,
    ).not.toBeNull()
  })

  it('should be invalid due to capitals in username', () => {
    transaction.usernameAsset('I_AM_INVALID').sign('passphrase')

    expect(
      Joi.validate(transaction.getStruct(), Joi.arkDelegateRegistration())
        .error,
    ).not.toBeNull()
  })

  it('should be invalid due to wrong transaction type', () => {
    transaction = transactionBuilder.transfer()
    transaction
      .recipientId(null)
      .amount(10 * constants.ARKTOSHI)
      .sign('passphrase')

    expect(
      Joi.validate(transaction.getStruct(), Joi.arkDelegateRegistration())
        .error,
    ).not.toBeNull()
  })
})
