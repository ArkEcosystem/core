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
})
