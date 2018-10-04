const ark = require('../../../lib/client')
const { TRANSACTION_TYPES } = require('../../../lib/constants')
const feeManager = require('../../../lib/managers/fee')
const transactionBuilderTests = require('./__shared__/transaction')

let builder

beforeEach(() => {
  builder = ark.getBuilder().transfer()

  global.builder = builder
})

describe('Transfer Transaction', () => {
  describe('verify', () => {
    it('should be valid with a signature', () => {
      const actual = builder
        .recipientId('D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F')
        .amount(1)
        .vendorField('dummy')
        .sign('dummy passphrase')

      expect(actual.build().verify()).toBeTrue()
    })

    it('should be valid with a second signature', () => {
      const actual = builder
        .recipientId('D5q7YfEFDky1JJVQQEy4MGyiUhr5cGg47F')
        .amount(1)
        .vendorField('dummy')
        .sign('dummy passphrase')
        .secondSign('dummy passphrase')

      expect(actual.build().verify()).toBeTrue()
    })
  })

  transactionBuilderTests()

  it('should have its specific properties', () => {
    expect(builder).toHaveProperty('data.type', TRANSACTION_TYPES.TRANSFER)
    expect(builder).toHaveProperty('data.fee', feeManager.get(TRANSACTION_TYPES.TRANSFER))
    expect(builder).toHaveProperty('data.amount', 0)
    expect(builder).toHaveProperty('data.recipientId', null)
    expect(builder).toHaveProperty('data.senderPublicKey', null)
    expect(builder).toHaveProperty('data.expiration', 0)
  })

  describe('vendorField', () => {
    it('should set the vendorField', () => {
      builder.vendorField('fake')
      expect(builder.data.vendorField).toBe('fake')
    })
  })
})
