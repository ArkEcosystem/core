const ark = require('../../../lib/client')
const transactionTests = require('./__shared__/transaction')

let transaction

beforeEach(() => {
  transaction = ark.getBuilder().timelockTransfer()

  global.transaction = transaction
})

describe('Timelock Transfer Transaction', () => {
  transactionTests()

  it('should have its specific properties', () => {
    expect(transaction).toHaveProperty('amount')
    expect(transaction).toHaveProperty('recipientId')
    expect(transaction).toHaveProperty('senderPublicKey')
    expect(transaction).toHaveProperty('timelockType')
    expect(transaction).toHaveProperty('timelock')
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

    it('establishes the time lock', () => {
      transaction.create(null, null, 'time lock')
      expect(transaction.timelock).toBe('time lock')
    })

    it('establishes the time lock type', () => {
      transaction.create(null, null, null, 'time lock type')
      expect(transaction.timelockType).toBe('time lock type')
    })
  })

  describe('vendorField', () => {
    it('should set the vendorField', () => {
      const data = 'dummy'
      transaction.vendorField(data)
      expect(transaction.vendorField).toBe(data)
    })
  })
})
