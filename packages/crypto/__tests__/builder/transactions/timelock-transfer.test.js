const ark = require('../../../lib/client')
const transactionBuilderTests = require('./__shared__/transaction')

let builder

beforeEach(() => {
  builder = ark.getBuilder().timelockTransfer()

  global.builder = builder
})

describe('Timelock Transfer Transaction', () => {
  transactionBuilderTests()

  it('should have its specific properties', () => {
    expect(builder).toHaveProperty('data.amount')
    expect(builder).toHaveProperty('data.recipientId')
    expect(builder).toHaveProperty('data.senderPublicKey')
    expect(builder).toHaveProperty('data.timelockType')
    expect(builder).toHaveProperty('data.timelock')
  })

  describe('create', () => {
    it('establishes the recipient id', () => {
      builder.create('homer')
      expect(builder.data.recipientId).toBe('homer')
    })

    it('establishes the amount', () => {
      builder.create(null, 'a lot of ARK')
      expect(builder.data.amount).toBe('a lot of ARK')
    })

    it('establishes the time lock', () => {
      builder.create(null, null, 'time lock')
      expect(builder.data.timelock).toBe('time lock')
    })

    it('establishes the time lock type', () => {
      builder.create(null, null, null, 'time lock type')
      expect(builder.data.timelockType).toBe('time lock type')
    })
  })

  describe('vendorField', () => {
    it('should set the vendorField', () => {
      const data = 'dummy'
      builder.vendorField(data)
      expect(builder.data.vendorField).toBe(data)
    })
  })
})
