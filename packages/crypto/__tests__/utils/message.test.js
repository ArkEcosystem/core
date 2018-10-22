const { Message } = require('../../lib/crypto')

const fixture = {
  data: {
    publicKey: '034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192',
    signature: '304402200fb4adddd1f1d652b544ea6ab62828a0a65b712ed447e2538db0caebfa68929e02205ecb2e1c63b29879c2ecf1255db506d671c8b3fa6017f67cfd1bf07e6edd1cc8',
    message: 'Hello World'
  },
  passphrase: 'this is a top secret passphrase'
}

describe('Message', () => {
  describe('sign', () => {
    it('should be a function', () => {
      expect(Message.sign).toBeFunction()
    })

    it('should be ok', () => {
      const actual = Message.sign(fixture.data.message, fixture.passphrase)

      expect(actual).toHaveProperty('publicKey')
      expect(actual).toHaveProperty('signature')
      expect(actual).toHaveProperty('message')
      expect(Message.verify(actual)).toBeTrue()
    })
  })

  describe('verify', () => {
    it('should be a function', () => {
      expect(Message.verify).toBeFunction()
    })

    it('should be ok', () => {
      expect(Message.verify(fixture.data)).toBeTrue()
    })
  })
})
