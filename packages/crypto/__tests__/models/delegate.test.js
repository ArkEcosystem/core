const Bignum = require('../../lib/utils/bignum')
const Wallet = require('../../lib/models/wallet')
const { ARKTOSHI } = require('../../lib/constants')
const sortTransactions = require('../../lib/utils/sort-transactions')
const configManager = require('../../lib/managers/config')

describe('Models - Delegate', () => {
  describe('static sortTransactions', () => {
    it('returns the transactions ordered by type and id', () => {
      const ordered = [
        { type: 1, id: 2 }, { type: 1, id: 8 },
        { type: 2, id: 5 }, { type: 2, id: 9 }
      ]
      const unordered = [ordered[3], ordered[2], ordered[1], ordered[0]]

      expect(sortTransactions(unordered)).toEqual(ordered)
    })
  })

  describe('forge', () => {
    describe('without version option', () => {
      it('doesn\'t sort the transactions', () => {
        const address = 'Abcde'
        const wallet = new Wallet(address)
        wallet.balance = new Bignum(ARKTOSHI)

        expect(wallet.toString()).toBe(`${address} (1 ${configManager.config.client.symbol})`)
      })

      // TODO probably useful for debugging
      it('throws an Error', () => {})
    })
  })
})
