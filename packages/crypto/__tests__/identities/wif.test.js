const testSubject = require('../../lib/identities/wif')
const { data, passphrase } = require('./fixture')

describe('Identities - WIF', () => {
  describe('fromPassphrase', () => {
    it('should be a function', () => {
      expect(testSubject.fromPassphrase).toBeFunction()
    })

    it('should be OK', () => {
      expect(testSubject.fromPassphrase(passphrase)).toBe(data.wif)
    })
  })
})
