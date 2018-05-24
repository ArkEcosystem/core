const ark = require('../../../lib/client')
const transactionTests = require('./__shared__/transaction')

let transaction

beforeEach(() => {
  transaction = ark.getBuilder().transfer()

  global.transaction = transaction
})

describe('Transfer Transaction', () => {
  transactionTests()

  it('should have its specific properties', () => {
    expect(transaction).toHaveProperty('amount')
    expect(transaction).toHaveProperty('recipientId')
    expect(transaction).toHaveProperty('senderPublicKey')
    expect(transaction).toHaveProperty('expiration')
  })

  describe('create', () => {
    it('establishes the recipient id', () => {
      transaction.create('homer')
      expect(transaction.recipientId).toBe('homer')
    })

    it('establishes the amount', () => {
      transaction.create(null, 'a lot of ARK')
      expect(transaction.amount).toBe('a lot of ARK')
    })
  })

  describe('vendorField', () => {
    it('should set the vendorField', () => {
      transaction.vendorField('fake')
      expect(transaction.vendorField).toBe('fake')
    })
  })
})
