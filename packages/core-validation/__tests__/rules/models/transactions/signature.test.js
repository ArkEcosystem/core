'use strict'

const rule = require('../../../../lib/rules/models/transactions/signature')
const { transactionBuilder } = require('@arkecosystem/client')
const address = 'APnDzjtDb1FthuqcLMeL5XMWb1uD1KeMGi'
const arktoshi = Math.pow(10, 8)

let transaction
beforeEach(() => {
  transaction = transactionBuilder.secondSignature()
})

describe('Second Signature Transaction Rule', () => {
  it('should be a function', () => {
    expect(rule).toBeFunction()
  })

  it('should be valid', () => {
    transaction.create('second passphrase')
               .sign('passphrase')
    expect(rule(transaction.getStruct()).fails).toBeFalsy()
  })

  it('should be valid with correct data', () => {
    transaction.create('second passphrase')
               .setFee(1 * arktoshi)
               .sign('passphrase')
    expect(rule(transaction.getStruct()).fails).toBeFalsy()
  })

  it('should be invalid due to non-zero amount', () => {
    transaction.create('second passphrase')
               .setAmount(10 * arktoshi)
               .sign('passphrase')
    expect(rule(transaction.getStruct()).passes).toBeFalsy()
  })

  it('should be invalid due to zero fee', () => {
    transaction.create('second passphrase')
               .setFee(0)
               .sign('passphrase')
    expect(rule(transaction.getStruct()).passes).toBeFalsy()
  })

  it('should be invalid due to second signature', () => {
    transaction.create('second passphrase')
               .setFee(0)
               .sign('passphrase')
               .secondSign('second passphrase')
    expect(rule(transaction.getStruct()).passes).toBeFalsy()
  })

  it('should be invalid due to wrong transaction type', () => {
    transaction = transactionBuilder.delegate()
    transaction.create('delegate_name')
               .sign('passphrase')
    expect(rule(transaction.getStruct()).passes).toBeFalsy()
  })
})
