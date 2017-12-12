const { expect } = require('chai')
const sinon = require('sinon')

const Account = require('model/account')

describe('Model | Account', () => {
  describe('toString', () => {
    // TODO implementation is right?
    xit('returns the address and the balance', () => {
      const address = 'Abcde'
      const account = new Account(address)
      account.balance = Math.pow(10, 8)

      expect(account.toString()).to.eql(`${address}=1`)
    })
  })
})
