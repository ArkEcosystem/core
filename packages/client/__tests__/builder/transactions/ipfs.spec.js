import ark from '../../../lib/client'
import transactionTests from './__shared__/transaction'

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
    expect(tx).not.toHaveProperty('ipfshash')
  })

  describe('create', () => {
    it('establishes the IPFS hash', () => {
      tx.create('zyx')
      expect(tx.ipfshash).toBe('zyx')
    })
  })
})
