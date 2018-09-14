'use strict'

const rule = require('../../../../../lib/validation/rules/models/transactions/delegate-registration')
const { constants, transactionBuilder } = require('../../../../../lib')

let transaction
beforeEach(() => {
  transaction = transactionBuilder.delegateRegistration()
})

describe('Delegate Registration Transaction Rule', () => {
  it('should be a function', () => {
    expect(rule).toBeFunction()
  })

  it('should be valid', () => {
    transaction.usernameAsset('delegate1')
               .sign('passphrase')

    expect(rule(transaction.getStruct()).errors).toBeNull()
  })

  it('should be invalid due to no transaction as object', () => {
    expect(rule('test').errors).not.toBeNull()
  })

  it('should be invalid due to non-zero amount', () => {
    transaction.usernameAsset('delegate1')
               .amount(10 * constants.ARKTOSHI)
               .sign('passphrase')

    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })

  it('should be invalid due to zero fee', () => {
    transaction.usernameAsset('delegate1')
               .fee(0)
               .sign('passphrase')

    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })

  it('should be invalid due to space in username', () => {
    transaction.usernameAsset('test 123')
               .sign('passphrase')

    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })

  it('should be invalid due to non-alphanumeric in username', () => {
    transaction.usernameAsset('£££')
               .sign('passphrase')

    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })

  it('should be invalid due to username too long', () => {
    transaction.usernameAsset('1234567890123456789012345')
               .sign('passphrase')

    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })

  it('should be invalid due to undefined username', () => {
    try {
      transaction.usernameAsset(undefined)
                 .sign('passphrase')
      expect(rule(transaction.getStruct()).errors).not.toBeNull()
    } catch (error) {
    }
  })

  it('should be invalid due to no username', () => {
    transaction.usernameAsset('')
               .sign('passphrase')

    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })

  it('should be invalid due to capitals in username', () => {
    transaction.usernameAsset('I_AM_INVALID')
               .sign('passphrase')

    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })

  it('should be invalid due to wrong transaction type', () => {
    transaction = transactionBuilder.transfer()
    transaction.recipientId(null)
               .amount(10 * constants.ARKTOSHI)
               .sign('passphrase')

    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })
})
