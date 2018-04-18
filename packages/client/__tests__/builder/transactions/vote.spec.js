import ark from '../../../lib/client'
import cryptoBuilder from '../../../lib/builder/crypto'
import transactionTests from './__shared__/transaction'

let tx

beforeEach(() => {
  tx = ark.getBuilder().vote()

  global.tx = tx
})

describe('Vote Transaction', () => {
  transactionTests()

  it('should have its specific properties', () => {
    expect(tx).toHaveProperty('amount')
    expect(tx).toHaveProperty('recipientId')
    expect(tx).toHaveProperty('senderPublicKey')
    expect(tx).toHaveProperty('asset')
  })

  describe('create', () => {
    it('establishes the votes asset', () => {
      const nonsenseVotes = ['Trump', 'Brexit', 'Rajoy']
      tx.create(nonsenseVotes)
      expect(tx.asset.votes).toBe(nonsenseVotes)
    })
  })

  describe('sign', () => {
    xit('establishes the recipient id', () => {
      cryptoBuilder.getKeys = jest.fn(pass => ({ publicKey: `${pass} public key` }))
      cryptoBuilder.sign = jest.fn()
      tx.sign('bad pass')
      expect(tx.recipientId).toBe('bad pass public key')
    })
  })
})
