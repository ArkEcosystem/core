const ark = require('../../../lib/client')
const transactionTests = require('./__shared__/transaction')

let tx

beforeEach(() => {
  tx = ark.getBuilder().ipfs()

  global.tx = tx
})

describe('IPFS Transaction', () => {
  transactionTests()

  it('should have its specific properties', () => {
    expect(tx).toHaveProperty('amount')
    expect(tx).toHaveProperty('vendorFieldHex')
    expect(tx).toHaveProperty('senderPublicKey')
    expect(tx).toHaveProperty('asset')
  })

  it('should not have the IPFS hash yet', () => {
    expect(tx).not.toHaveProperty('ipfsHash')
  })

  describe('create', () => {
    it('establishes the IPFS hash', () => {
      tx.create('zyx')
      expect(tx.ipfsHash).toBe('zyx')
    })
  })
})
