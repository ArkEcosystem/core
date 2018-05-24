const ark = require('../../../lib/client')
const transactionBuilderTests = require('./__shared__/transaction')

let builder

beforeEach(() => {
  builder = ark.getBuilder().ipfs()

  global.builder = builder
})

describe('IPFS Transaction', () => {
  transactionBuilderTests()

  it('should have its specific properties', () => {
    expect(builder).toHaveProperty('data.amount')
    expect(builder).toHaveProperty('data.vendorFieldHex')
    expect(builder).toHaveProperty('data.senderPublicKey')
    expect(builder).toHaveProperty('data.asset')
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
    it('should generate and set the vendorFieldHex', () => {
      const data = 'hash'
      const hex = Buffer.from(data, 0).toString('hex')
      const paddedHex = hex.padStart(128, '0')

      builder.data.ipfsHash = data
      builder.vendorField(0)
      expect(builder.data.vendorFieldHex).toBe(paddedHex)
    })
  })
})
