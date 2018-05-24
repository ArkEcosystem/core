const ark = require('../../../lib/client')
const transactionTests = require('./__shared__/transaction')

let transaction

beforeEach(() => {
  transaction = ark.getBuilder().multiPayment()

  global.transaction = transaction
})

describe('Multi Payment Transaction', () => {
  transactionTests()

  it('should have its specific properties', () => {
    expect(transaction).toHaveProperty('payments')
    expect(transaction).toHaveProperty('vendorFieldHex')
  })

  describe('setVendorField', () => {
    xit('should generate and set the vendorFieldHex', () => {
      transaction.setVendorField('fake')
      expect(transaction.vendorFieldHex).toBe('fake')
    })
  })

  describe('addPayment', () => {
    it('should add new payments', () => {
      transaction.addPayment('address', 'amount')
      transaction.addPayment('address', 'amount')
      transaction.addPayment('address', 'amount')

      expect(transaction.payments).toEqual({
        address1: 'address',
        address2: 'address',
        address3: 'address',
        amount1: 'amount',
        amount2: 'amount',
        amount3: 'amount'
      })
    })
  })
})
