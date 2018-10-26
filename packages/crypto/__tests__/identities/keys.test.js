const testSubject = require('../../lib/identities/keys')
const Address = require('../../lib/identities/address')

describe('Identities - Keys', () => {
  describe('fromPassphrase', () => {
    it('should be a function', () => {
      expect(testSubject.fromPassphrase).toBeFunction()
    })

    it('should return two keys in hex', () => {
      const keys = testSubject.fromPassphrase('secret')

      expect(keys).toBeObject()
      expect(keys).toHaveProperty('publicKey')
      expect(keys).toHaveProperty('privateKey')

      expect(keys.publicKey).toBeString()
      expect(keys.publicKey).toMatch(Buffer.from(keys.publicKey, 'hex').toString('hex'))

      expect(keys.privateKey).toBeString()
      expect(keys.privateKey).toMatch(Buffer.from(keys.privateKey, 'hex').toString('hex'))
    })

    it('should return address', () => {
      const keys = testSubject.fromPassphrase('SDgGxWHHQHnpm5sth7MBUoeSw7V7nbimJ1RBU587xkryTh4qe9ov')
      const address = Address.fromPublicKey(keys.publicKey.toString('hex'))
      expect(address).toBe('DUMjDrT8mgqGLWZtkCqzvy7yxWr55mBEub')
    })
  })

  describe('fromWIF', () => {
    it('should be a function', () => {
      expect(testSubject.fromWIF).toBeFunction()
    })

    it('should return two keys in hex', () => {
      const keys = testSubject.fromWIF('SDgGxWHHQHnpm5sth7MBUoeSw7V7nbimJ1RBU587xkryTh4qe9ov')

      expect(keys).toBeObject()
      expect(keys).toHaveProperty('publicKey')
      expect(keys).toHaveProperty('privateKey')

      expect(keys.publicKey).toBeString()
      expect(keys.publicKey).toMatch(Buffer.from(keys.publicKey, 'hex').toString('hex'))

      expect(keys.privateKey).toBeString()
      expect(keys.privateKey).toMatch(Buffer.from(keys.privateKey, 'hex').toString('hex'))
    })

    it('should return address', () => {
      const keys = testSubject.fromWIF('SDgGxWHHQHnpm5sth7MBUoeSw7V7nbimJ1RBU587xkryTh4qe9ov')
      const address = Address.fromPublicKey(keys.publicKey.toString('hex'))
      expect(address).toBe('DCAaPzPAhhsMkHfQs7fZvXFW2EskDi92m8')
    })

    it('should get keys from compressed WIF', () => {
      const keys = testSubject.fromWIF('SAaaKsDdWMXP5BoVnSBLwTLn48n96UvG42WSUUooRv1HrEHmaSd4')

      expect(keys).toBeObject()
      expect(keys).toHaveProperty('publicKey')
      expect(keys).toHaveProperty('privateKey')
      expect(keys).toHaveProperty('compressed', true)
    })

    it('should get keys from uncompressed WIF', () => {
      const keys = testSubject.fromWIF('6hgnAG19GiMUf75C43XteG2mC8esKTiX9PYbKTh4Gca9MELRWmg')

      expect(keys).toBeObject()
      expect(keys).toHaveProperty('publicKey')
      expect(keys).toHaveProperty('privateKey')
      expect(keys).toHaveProperty('compressed', false)
    })
  })
})
