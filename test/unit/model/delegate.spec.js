const { expect } = require('chai')
const sinon = require('sinon')

const Delegate = require('model/delegate')

describe('Model | Delegate', () => {
  describe('static sortTransactions', () => {
    it('returns the transactions ordered by type and id', () => {
      const ordered = [
        { type: 1, id: 2 }, { type: 1, id: 8 },
        { type: 2, id: 5 }, { type: 2, id: 9 }
      ]
      const unordered = [ordered[3], ordered[2], ordered[1], ordered[0]]

      expect(Delegate.sortTransactions(unordered)).to.eql(ordered)
    })
  })

  describe('forge', () => {
    context('without version option', () => {
      xit('doesn\'t sort the transactions', () => {
        const address = 'Abcde'
        const account = new Account(address)
        account.balance = Math.pow(10, 8)

        expect(account.toString()).to.eql(`${address}=1`)
      })

      // TODO probably useful for debugging
      xit('throws an Error', () => {
      })
    })
  })
})
