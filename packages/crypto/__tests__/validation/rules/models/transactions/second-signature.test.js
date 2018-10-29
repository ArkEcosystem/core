'use strict'

const rule = require('../../../../../lib/validation/rules/models/transactions/second-signature')
const { constants, transactionBuilder } = require('../../../../../lib')

let transaction
beforeEach(() => {
  transaction = transactionBuilder.secondSignature()
})

// NOTE some tests aren't strictly about the second signature

describe('Second Signature Transaction Rule', () => {
  it('should be a function', () => {
    expect(rule).toBeFunction()
  })

  it('should be valid', () => {
    transaction.signatureAsset('second passphrase')
      .sign('passphrase')
    expect(rule(transaction.getStruct()).errors).toBeNull()
  })

  it('should be valid with correct data', () => {
    transaction.signatureAsset('second passphrase')
      .fee(1 * constants.ARKTOSHI)
      .sign('passphrase')
    expect(rule(transaction.getStruct()).errors).toBeNull()
  })

  it('should be invalid due to no transaction as object', () => {
    expect(rule('test').errors).not.toBeNull()
  })

  it('should be invalid due to non-zero amount', () => {
    transaction.signatureAsset('second passphrase')
      .amount(10 * constants.ARKTOSHI)
      .sign('passphrase')
    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })

  it('should be invalid due to zero fee', () => {
    transaction.signatureAsset('second passphrase')
      .fee(0)
      .sign('passphrase')
    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })

  it('should be invalid due to second signature', () => {
    transaction.signatureAsset('second passphrase')
      .fee(0)
      .sign('passphrase')
      .secondSign('second passphrase')
    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })

  it('should be invalid due to wrong transaction type', () => {
    transaction = transactionBuilder.delegateRegistration()
    transaction.usernameAsset('delegate_name')
      .sign('passphrase')
    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })
})
