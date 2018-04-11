import Ark from '../../../src'
import network from '../../../src/networks/ark/devnet.json'
import transactionTests from './__shared__/transaction'

let ark
let tx

beforeEach(() => {
  ark = new Ark(network)
  tx = ark.getBuilder().transfer()

  global.tx = tx
})

describe('Transfer Transaction', () => {
  transactionTests()

  it('should have its specific properties', () => {
    expect(tx).toHaveProperty('amount')
    expect(tx).toHaveProperty('recipientId')
    expect(tx).toHaveProperty('senderPublicKey')
    expect(tx).toHaveProperty('expiration')
  })

  describe('create', () => {
    it('establishes the recipient id', () => {
      tx.create('homer')
      expect(tx.recipientId).toBe('homer')
    })
    it('establishes the amount', () => {
      tx.create(null, 'a lot of ARK')
      expect(tx.amount).toBe('a lot of ARK')
    })
  })
})
