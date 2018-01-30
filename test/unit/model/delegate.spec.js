const Delegate = require('model/delegate')
const Wallet = require('model/wallet')

describe('Model | Delegate', () => {
  describe('static sortTransactions', () => {
    it('returns the transactions ordered by type and id', () => {
      const ordered = [
        { type: 1, id: 2 }, { type: 1, id: 8 },
        { type: 2, id: 5 }, { type: 2, id: 9 }
      ]
      const unordered = [ordered[3], ordered[2], ordered[1], ordered[0]]

      Delegate.sortTransactions(unordered).should.deep.equal(ordered)
    })
  })

  describe('forge', () => {
    context('without version option', () => {
      it.skip('doesn\'t sort the transactions', () => {
        const address = 'Abcde'
        const wallet = new Wallet(address)
        wallet.balance = 10 ** 8

        wallet.toString().should.equal(`${address}=1`)
      })

      // TODO probably useful for debugging
      it.skip('throws an Error', () => {})
    })
  })
})
