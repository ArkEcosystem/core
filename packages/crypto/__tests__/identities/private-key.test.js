const testSubject = require('../../lib/identities/private-key')
const { data, passphrase } = require('./fixture')

describe('Identities - Private Key', () => {
  describe('fromPassphrase', () => {
    it('should be a function', () => {
      expect(testSubject.fromPassphrase).toBeFunction()
    })

    it('should be OK', () => {
      expect(testSubject.fromPassphrase(passphrase)).toBe(data.privateKey)
    })
  })

  describe('fromWIF', () => {
    it('should be a function', () => {
      expect(testSubject.fromWIF).toBeFunction()
    })

    it('should be OK', () => {
      expect(testSubject.fromWIF(data.wif)).toBe(data.privateKey)
    })
  })
})
