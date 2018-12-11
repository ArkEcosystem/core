const bip38 = require('bip38')

const { keys } = require('@arkecosystem/crypto').identities
const { Delegate } = require('@arkecosystem/crypto').models
const { TESTNET } = require('@arkecosystem/crypto').constants.CONFIGURATIONS.ARK

const passphrase = 'this is a top secret passphrase'
const password = '123'

describe('Delegate Model - Crypto', () => {
  describe('Instantiation scenarios', () => {
    it('Should throw when creating an empty Delegate', () => {
      expect(() => {
        const delegate = new Delegate()
      }).toThrow()
    })

    it('Should fail when providing passphrase without network', () => {
      expect(() => {
        const delegate = new Delegate(passphrase)
      }).toThrow()
    })

    it('Should create a new Delegate when provided a passphrase and network', () => {
      const delegate = new Delegate(passphrase, TESTNET)
      expect(delegate.keys).toHaveProperty('privateKey')
      expect(delegate.network).toHaveProperty('name', 'testnet')
    })
  })

  describe('BIP38 Encryption with password', () => {
    let encryptedPassphrase
    let decryptedKeys
    let delegate

    it('Should return a valid encrypted passphrase', () => {
      encryptedPassphrase = Delegate.encryptPassphrase(
        passphrase,
        TESTNET,
        password,
      )

      expect(bip38.verify(encryptedPassphrase)).toBe(true)
    })

    it('Should decrypt into the original passphrase', () => {
      decryptedKeys = Delegate.decryptPassphrase(
        encryptedPassphrase,
        TESTNET,
        password,
      )

      expect(keys.fromPassphrase(passphrase).privateKey).toBe(
        decryptedKeys.privateKey,
      )
    })

    it('Should create a delegate with the encrypted passphrase, network and password', () => {
      delegate = new Delegate(encryptedPassphrase, TESTNET, password)

      expect(delegate.keys).toBe(null)
      expect(delegate).toHaveProperty('encryptedKeys')
      expect(delegate.network).toHaveProperty('name', 'testnet')
    })

    it('Should decrypt into keys using encryptedKeys and otp', () => {
      delegate.decryptKeysWithOtp()

      expect(decryptedKeys).toEqual(delegate.keys)
    })

    it('Should catch missing arguments and set keys to null', () => {
      const localDelegate = new Delegate(encryptedPassphrase)

      expect(localDelegate.address).toBe(null)
      expect(localDelegate.publicKey).toBe(null)
      expect(localDelegate.keys).toBe(null)
    })
  })
})
