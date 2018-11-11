const rule = require('../../../../../lib/validation/rules/models/transactions/transfer')
const { constants, transactionBuilder } = require('../../../../../lib')

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
    transaction
      .recipientId(address)
      .amount(amount)
      .sign('passphrase')
    expect(rule(transaction.getStruct()).errors).toBeNull()
  })

  it('should be valid with correct data', () => {
    transaction
      .recipientId(address)
      .amount(amount)
      .fee(fee)
      .vendorField('Ahoy')
      .sign('passphrase')
    expect(rule(transaction.getStruct()).errors).toBeNull()
  })

  it('should be valid with up to 64 bytes in vendor field', () => {
    transaction
      .recipientId(address)
      .amount(amount)
      .fee(fee)
      .vendorField('a'.repeat(64))
      .sign('passphrase')
    expect(rule(transaction.getStruct()).errors).toBeNull()

    transaction
      .recipientId(address)
      .amount(amount)
      .fee(fee)
      .vendorField('⊁'.repeat(21))
      .sign('passphrase')
    expect(rule(transaction.getStruct()).errors).toBeNull()
  })

  it('should be invalid with more than 64 bytes in vendor field', () => {
    transaction
      .recipientId(address)
      .amount(amount)
      .fee(fee)
      .vendorField('a'.repeat(65))
      .sign('passphrase')
    expect(rule(transaction.getStruct()).errors).not.toBeNull()

    transaction
      .recipientId(address)
      .amount(amount)
      .fee(fee)
      .vendorField('⊁'.repeat(22))
      .sign('passphrase')
    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })

  it('should be invalid due to no transaction as object', () => {
    expect(rule('test').errors).not.toBeNull()
  })

  it('should be invalid due to no address', () => {
    transaction
      .recipientId(null)
      .amount(amount)
      .sign('passphrase')
    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })

  it('should be invalid due to invalid address', () => {
    transaction
      .recipientId(address)
      .amount(amount)
      .sign('passphrase')
    const struct = transaction.getStruct()
    struct.recipientId = 'woop'
    expect(rule(struct).errors).not.toBeNull()
  })

  it('should be invalid due to zero amount', () => {
    transaction
      .recipientId(address)
      .amount(0)
      .sign('passphrase')
    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })

  it('should be invalid due to zero fee', () => {
    transaction
      .recipientId(address)
      .amount(0)
      .fee(0)
      .sign('passphrase')
    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })

  it('should be invalid due to wrong transaction type', () => {
    transaction = transactionBuilder.delegateRegistration()
    transaction.usernameAsset('delegate_name').sign('passphrase')
    expect(rule(transaction.getStruct()).errors).not.toBeNull()
  })
})
