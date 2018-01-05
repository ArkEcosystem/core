const { expect } = require('chai')

const Account = require('model/account')

describe('Model | Account', () =>
  describe('toString', () =>
    // TODO implementation is right?
    it('returns the address and the balance', () => {
      const address = 'Abcde'
      const account = new Account(address)
      const balance = parseFloat((Math.random() * 1000).toFixed(8))
      account.balance = balance * Math.pow(10, 8)

      expect(account.toString()).to.eql(`${address}=${balance}`)
    })
  )
)
