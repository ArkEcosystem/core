const ark = require('../../../lib/client')
const { TRANSACTION_TYPES } = require('../../../lib/constants')
const feeManager = require('../../../lib/managers/fee')
const transactionBuilderTests = require('./__shared__/transaction')

let builder

beforeEach(() => {
  builder = ark.getBuilder().ipfs()

  global.builder = builder
})

describe('IPFS Transaction', () => {
  transactionBuilderTests()

  it('should have its specific properties', () => {
    expect(builder).toHaveProperty('data.type', TRANSACTION_TYPES.IPFS)
    expect(builder).toHaveProperty(
      'data.fee',
      feeManager.get(TRANSACTION_TYPES.IPFS),
    )
    expect(builder).toHaveProperty('data.amount', 0)
    expect(builder).toHaveProperty('data.vendorFieldHex', null)
    expect(builder).toHaveProperty('data.senderPublicKey', null)
    expect(builder).toHaveProperty('data.asset', {})
  })

  it('should not have the IPFS hash yet', () => {
    expect(builder).not.toHaveProperty('data.ipfsHash')
  })

  describe('ipfsHash', () => {
    it('establishes the IPFS hash', () => {
      builder.ipfsHash('zyx')
      expect(builder.data.ipfsHash).toBe('zyx')
    })
  })

  describe('vendorField', () => {
    // TODO This is test is OK, but the Subject Under Test might be wrong,
    // so it is better to not assume that this is the desired behaviour
    it.skip('should generate and set the vendorFieldHex', () => {
      const data = 'hash'
      const hex = Buffer.from(data, 0).toString('hex')
      const paddedHex = hex.padStart(128, '0')

      builder.data.ipfsHash = data
      builder.vendorField(0)
      expect(builder.data.vendorFieldHex).toBe(paddedHex)
    })
  })
})
