const ark = require('../../../lib/client')
const transactionTests = require('./__shared__/transaction')

let transaction

beforeEach(() => {
  transaction = ark.getBuilder().ipfs()

  global.transaction = transaction
})

describe('IPFS Transaction', () => {
  transactionTests()

  it('should have its specific properties', () => {
    expect(transaction).toHaveProperty('amount')
    expect(transaction).toHaveProperty('vendorFieldHex')
    expect(transaction).toHaveProperty('senderPublicKey')
    expect(transaction).toHaveProperty('asset')
  })

  it('should not have the IPFS hash yet', () => {
    expect(transaction).not.toHaveProperty('ipfsHash')
  })

  describe('create', () => {
    it('establishes the IPFS hash', () => {
      transaction.create('zyx')
      expect(transaction.ipfsHash).toBe('zyx')
    })
  })

  describe('vendorField', () => {
    it('should generate and set the vendorFieldHex', () => {
      const data = 'hash'
      const hex = Buffer.from(data, 0).toString('hex')
      const paddedHex = hex.padStart(128, '0')

      transaction.ipfsHash = data
      transaction.vendorField(0)
      expect(transaction.vendorFieldHex).toBe(paddedHex)
    })
  })
})
