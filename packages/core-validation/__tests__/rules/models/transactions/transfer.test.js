'use strict'

const rule = require('../../../../lib/rules/models/transactions/transfer')
const { transactionBuilder } = require('@arkecosystem/client')
const address = 'APnDzjtDb1FthuqcLMeL5XMWb1uD1KeMGi'
const arktoshi = Math.pow(10, 8)
const fee = 1 * arktoshi
const amount = 10 * arktoshi

let transaction
beforeEach(() => {
  transaction = transactionBuilder.transfer()
})

describe('Transfer Transaction Rule', () => {
  it('should be a function', () => {
    expect(rule).toBeFunction()
  })

  it('should be valid', () => {
    transaction.create(address, amount)
               .sign('passphrase')
    expect(rule(transaction.getStruct()).fails).toBeFalsy()
  })

  it('should be valid with correct data', () => {
    transaction.create(address, amount)
               .setFee(fee)
               .setVendorField('Ahoy')
               .sign('passphrase')
    expect(rule(transaction.getStruct()).fails).toBeFalsy()
  })

  it('should be invalid due to no transaction as object', () => {
    expect(rule('test').passes).toBeFalsy()
  })

  it('should be invalid due to no address', () => {
    transaction.create(null, amount)
               .sign('passphrase')
    expect(rule(transaction.getStruct()).passes).toBeFalsy()
  })

  it('should be invalid due to invalid address', () => {
    transaction.create(address, amount)
               .sign('passphrase')
    const struct = transaction.getStruct()
    struct.recipientId = 'woop'
    expect(rule(struct).passes).toBeFalsy()
  })

  it('should be invalid due to zero amount', () => {
    transaction.create(address, 0)
               .sign('passphrase')
    expect(rule(transaction.getStruct()).passes).toBeFalsy()
  })

  it('should be invalid due to zero fee', () => {
    transaction.create(address, 0)
               .setFee(0)
               .sign('passphrase')
    expect(rule(transaction.getStruct()).passes).toBeFalsy()
  })

  it('should be invalid due to wrong transaction type', () => {
    transaction = transactionBuilder.delegateRegistration()
    transaction.create('delegate_name')
               .sign('passphrase')
    expect(rule(transaction.getStruct()).passes).toBeFalsy()
  })
})
