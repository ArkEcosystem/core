import Ark from '../../../src'
import network from '../../../src/networks/ark/devnet.json'
import transactionTests from './__shared__/transaction'

let ark
let tx

beforeEach(() => {
  ark = new Ark(network)
  tx = ark.getBuilder().timelockTransfer()

  global.tx = tx
})

describe('Timelock Transfer Transaction', () => {
  transactionTests()

  it('should have its specific properties', () => {
    expect(tx).toHaveProperty('amount')
    expect(tx).toHaveProperty('recipientId')
    expect(tx).toHaveProperty('senderPublicKey')
    expect(tx).toHaveProperty('timelockType')
    expect(tx).toHaveProperty('timelock')
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
    it('establishes the time lock', () => {
      tx.create(null, null, 'time lock')
      expect(tx.timelock).toBe('time lock')
    })
    it('establishes the time lock type', () => {
      tx.create(null, null, null, 'time lock type')
      expect(tx.timelockType).toBe('time lock type')
    })
  })
})
