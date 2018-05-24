const crypto = require('../../lib/crypto/utils')
const fixtures = require('./fixtures/crypto.json')

const buffer = Buffer.from('Hello World')

describe('Crypto - Utils', () => {
  it('should be instantiated', () => {
    expect(crypto).toBeObject()
  })

  it('should return valid ripemd160', () => {
    expect(crypto.ripemd160(buffer).toString('hex')).toEqual(fixtures.ripemd160)
  })

  it('should return valid sha1', () => {
    expect(crypto.sha1(buffer).toString('hex')).toEqual(fixtures.sha1)
  })

  it('should return valid sha256', () => {
    expect(crypto.sha256(buffer).toString('hex')).toEqual(fixtures.sha256)
  })

  it('should return valid hash160', () => {
    expect(crypto.hash160(buffer).toString('hex')).toEqual(fixtures.hash160)
  })

  it('should return valid hash256', () => {
    expect(crypto.hash256(buffer).toString('hex')).toEqual(fixtures.hash256)
  })
})
