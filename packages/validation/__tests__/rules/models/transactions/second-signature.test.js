'use strict'

const rule = require('../../../../lib/rules/models/transactions/second-signature')
const { constants, transactionBuilder } = require('@arkecosystem/crypto')

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
    transaction.create('second passphrase')
               .sign('passphrase')
    expect(rule(transaction.getStruct()).errors).toBeNull()
  })

  it('should be valid with correct data', () => {
    transaction.create('second passphrase')
               .setFee(1 * constants.ARKTOSHI)
               .sign('passphrase')
    expect(rule(transaction.getStruct()).errors).toBeNull()
  })

  it('should be invalid due to no transaction as object', () => {
    expect(rule('test').errors).not.toBeNull()
  })

  it('should be invalid due to non-zero amount', () => {
    transaction.create('second passphrase')
               .setAmount(10 * constants.ARKTOSHI)
               .sign('passphrase')
    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })

  it('should be invalid due to zero fee', () => {
    transaction.create('second passphrase')
               .setFee(0)
               .sign('passphrase')
    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })

  it('should be invalid due to second signature', () => {
    transaction.create('second passphrase')
               .setFee(0)
               .sign('passphrase')
               .secondSign('second passphrase')
    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })

  it('should be invalid due to wrong transaction type', () => {
    transaction = transactionBuilder.delegateRegistration()
    transaction.create('delegate_name')
               .sign('passphrase')
    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })
})
