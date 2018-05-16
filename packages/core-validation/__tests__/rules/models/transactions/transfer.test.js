'use strict'

const rule = require('../../../../lib/rules/models/transactions/transfer')
const { transactionBuilder } = require('@arkecosystem/client')
let transaction
const address = 'APnDzjtDb1FthuqcLMeL5XMWb1uD1KeMGi'
const arktoshi = Math.pow(10, 8)

beforeEach(() => {
  transaction = transactionBuilder.transfer()
})

describe('Transfer Transaction Rule', () => {
  it('should be a function', () => {
    expect(rule).toBeFunction()
  })

  it('should be valid', () => {
    transaction.create(address, 10 * arktoshi)
               .sign('passphrase')
    expect(rule(transaction.getStruct()).fails).toBeFalsy()
  })

  it('should be valid with full data', () => {
    transaction.create(address, 10 * arktoshi)
               .setFee(1 * arktoshi)
               .setVendorField('Hioo')
               .sign('passphrase')
    expect(rule(transaction.getStruct()).fails).toBeFalsy()
  })

  it('should be invalid due to tx amount', () => {
    transaction.create(address, 0)
               .sign('passphrase')
    expect(rule(transaction.getStruct()).passes).toBeFalsy()
  })

  it('should be invalid due to wrong transaction type', () => {
    transaction = transactionBuilder.delegate()
    transaction.create('delegate_name')
               .sign('passphrase')
    expect(rule(transaction.getStruct()).passes).toBeFalsy()
  })
})
