'use strict'

const rule = require('../../../../lib/rules/models/transactions/delegate-registration')
const { transactionBuilder } = require('@arkecosystem/client')
const arktoshi = Math.pow(10, 8)

let transaction
beforeEach(() => {
  transaction = transactionBuilder.delegateRegistration()
})

describe('Delegate Registration Transaction Rule', () => {
  it('should be a function', () => {
    expect(rule).toBeFunction()
  })

  it('should be valid', () => {
    transaction.create('delegate1')
               .sign('passphrase')
    expect(rule(transaction.getStruct()).fails).toBeFalsy()
  })

  it('should be invalid due to no transaction as object', () => {
    expect(rule('test').passes).toBeFalsy()
  })

  it('should be invalid due to non-zero amount', () => {
    transaction.create('delegate1')
               .setAmount(10 * arktoshi)
               .sign('passphrase')
    expect(rule(transaction.getStruct()).passes).toBeFalsy()
  })

  it('should be invalid due to zero fee', () => {
    transaction.create('delegate1')
               .setFee(0)
               .sign('passphrase')
    expect(rule(transaction.getStruct()).passes).toBeFalsy()
  })

  it('should be invalid due to space in username', () => {
    transaction.create('test 123')
               .sign('passphrase')
    expect(rule(transaction.getStruct()).passes).toBeFalsy()
  })

  it('should be invalid due to non-alphanumeric in username', () => {
    transaction.create('£££')
               .sign('passphrase')
    expect(rule(transaction.getStruct()).passes).toBeFalsy()
  })

  it('should be invalid due to capitals in username', () => {
    transaction.create('I_AM_INVALID')
               .sign('passphrase')
    expect(rule(transaction.getStruct()).passes).toBeFalsy()
  })

  it('should be invalid due to wrong transaction type', () => {
    transaction = transactionBuilder.transfer()
    transaction.create(null, 10 * arktoshi)
               .sign('passphrase')
    expect(rule(transaction.getStruct()).passes).toBeFalsy()
  })
})
