const ark = require('../../../lib/client')
const { TRANSACTION_TYPES } = require('../../../lib/constants')
const feeManager = require('../../../lib/managers/fee')
const transactionBuilderTests = require('./__shared__/transaction')

let builder

beforeEach(() => {
  builder = ark.getBuilder().multiPayment()

  global.builder = builder
})

describe('Multi Payment Transaction', () => {
  transactionBuilderTests()

  it('should have its specific properties', () => {
    expect(builder).toHaveProperty('data.type', TRANSACTION_TYPES.MULTI_PAYMENT)
    expect(builder).toHaveProperty(
      'data.fee',
      feeManager.get(TRANSACTION_TYPES.MULTI_PAYMENT),
    )
    expect(builder).toHaveProperty('data.payments', {})
    expect(builder).toHaveProperty('data.vendorFieldHex', null)
  })

  describe('vendorField', () => {
    it('should set the vendorField', () => {
      const data = 'dummy'
      builder.vendorField(data)
      expect(builder.data.vendorField).toBe(data)
    })
  })

  describe('addPayment', () => {
    it('should add new payments', () => {
      builder.addPayment('address', 'amount')
      builder.addPayment('address', 'amount')
      builder.addPayment('address', 'amount')

      expect(builder.data.payments).toEqual({
        address1: 'address',
        address2: 'address',
        address3: 'address',
        amount1: 'amount',
        amount2: 'amount',
        amount3: 'amount',
      })
    })
  })
})
