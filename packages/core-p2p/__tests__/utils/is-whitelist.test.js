const isWhitelist = require('../../lib/utils/is-whitelist')

const whitelisted = ['127.0.0.1', '::ffff:127.0.0.1']

describe('isWhitelist', () => {
  it('should be a function', () => {
    expect(isWhitelist).toBeFunction()
  })

  it('should be ok for 127.0.0.1', () => {
    expect(isWhitelist(whitelisted, '127.0.0.1')).toBeTrue()
  })

  it('should be ok for ::ffff:127.0.0.1', () => {
    expect(isWhitelist(whitelisted, '::ffff:127.0.0.1')).toBeTrue()
  })

  it('should not be ok', () => {
    expect(isWhitelist(whitelisted, 'dummy')).toBeFalse()
  })
})
