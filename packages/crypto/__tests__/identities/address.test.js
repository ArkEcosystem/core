const testSubject = require('../../lib/identities/address')
const Keys = require('../../lib/identities/keys')
const { data, passphrase } = require('./fixture')

describe('Identities - Address', () => {
  describe('fromPassphrase', () => {
    it('should be a function', () => {
      expect(testSubject.fromPassphrase).toBeFunction()
    })

    it('should be OK', () => {
      expect(testSubject.fromPassphrase(passphrase)).toBe(data.address)
    })
  })

  describe('fromPublicKey', () => {
    it('should be a function', () => {
      expect(testSubject.fromPublicKey).toBeFunction()
    })

    it('should be OK', () => {
      expect(testSubject.fromPublicKey(data.publicKey)).toBe(data.address)
    })
  })

  describe('fromPrivateKey', () => {
    it('should be a function', () => {
      expect(testSubject.fromPrivateKey).toBeFunction()
    })

    it('should be OK', () => {
      expect(testSubject.fromPrivateKey(Keys.fromPassphrase(passphrase))).toBe(data.address)
    })
  })

  describe('validate', () => {
    it('should be a function', () => {
      expect(testSubject.validate).toBeFunction()
    })

    it('should be OK', () => {
      expect(testSubject.validate(data.address)).toBeTrue()
    })
  })
})
