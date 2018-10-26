const Message = require('../../lib/crypto/message')
const { crypto } = require('../../lib/crypto')

const passphrase = 'sample passphrase'
const wif = crypto.keysToWIF(crypto.getKeys(passphrase), { wif: 170 })
const signedMessageEntries = [
  ['publicKey', '03bb51bbf5bf84759452e33dd97cf72cc8904be07df07a946a0d84939400f17e87'],
  ['signature', '304402204550cd28d369a7f6eccd399b315e42e054a2f21f6771983af4ed3c5f7c7fa83102200699fef72cc64e79ccba85a31666e9508c052038c71c04260264e3d2d11c7e08'],
  ['message', 'test']
]

describe('Message', () => {
  describe('sign', () => {
    it('should be a function', () => {
      expect(Message.sign).toBeFunction()
    })

    it('should sign a message', () => {
      expect(Message.sign('test', passphrase)).toContainAllEntries(signedMessageEntries)
    })
  })

  describe('signWithWif', () => {
    it('should be a function', () => {
      expect(Message.signWithWif).toBeFunction()
    })

    it('should sign a message', () => {
      expect(Message.signWithWif('test', wif)).toContainAllEntries(signedMessageEntries)
    })

    it('should sign a message and match passphrase', () => {
      const signedMessage = Message.sign('test', passphrase)
      const signedWifMessage = Message.signWithWif('test', wif)
      expect(signedMessage).toEqual(signedWifMessage)
    })
  })

  describe('verify', () => {
    it('should be a function', () => {
      expect(Message.verify).toBeFunction()
    })

    it('should verify a signed message', () => {
      const signedMessage = Message.sign('test', passphrase)
      expect(Message.verify(signedMessage)).toBe(true)
    })

    it('should verify a signed wif message', () => {
      const signedMessage = Message.signWithWif('test', wif)
      expect(Message.verify(signedMessage)).toBe(true)
    })
  })
})
