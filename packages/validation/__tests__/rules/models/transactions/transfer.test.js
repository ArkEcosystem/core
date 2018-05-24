'use strict'

const rule = require('../../../../lib/rules/models/transactions/transfer')
const { constants, transactionBuilder } = require('@arkecosystem/crypto')
const address = 'APnDzjtDb1FthuqcLMeL5XMWb1uD1KeMGi'
const fee = 1 * constants.ARKTOSHI
const amount = 10 * constants.ARKTOSHI

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
    expect(rule(transaction.getStruct()).errors).toBeNull()
  })

  it('should be valid with correct data', () => {
    transaction.create(address, amount)
               .setFee(fee)
               .vendorField('Ahoy')
               .sign('passphrase')
    expect(rule(transaction.getStruct()).errors).toBeNull()
  })

  it('should be invalid due to no transaction as object', () => {
    expect(rule('test').errors).not.toBeNull()
  })

  it('should be invalid due to no address', () => {
    transaction.create(null, amount)
               .sign('passphrase')
    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })

  it('should be invalid due to invalid address', () => {
    transaction.create(address, amount)
               .sign('passphrase')
    const struct = transaction.getStruct()
    struct.recipientId = 'woop'
    expect(rule(struct).errors).not.toBeNull()
  })

  it('should be invalid due to zero amount', () => {
    transaction.create(address, 0)
               .sign('passphrase')
    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })

  it('should be invalid due to zero fee', () => {
    transaction.create(address, 0)
               .setFee(0)
               .sign('passphrase')
    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })

  it('should be invalid due to wrong transaction type', () => {
    transaction = transactionBuilder.delegateRegistration()
    transaction.create('delegate_name')
               .sign('passphrase')
    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })
})
