const { Bignum, formatPhantomtoshi } = require('../../lib/utils')
const { PHANTOMTOSHI } = require('../../lib/constants')

describe('Format Phantomtoshi', () => {
  it('should format phantomtoshis', () => {
    expect(formatPhantomtoshi(PHANTOMTOSHI)).toBe('1 ⓟ')
    expect(formatPhantomtoshi(0.1 * PHANTOMTOSHI)).toBe('0.1 ⓟ')
    expect(formatPhantomtoshi((0.1 * PHANTOMTOSHI).toString())).toBe('0.1 ⓟ')
    expect(formatPhantomtoshi(new Bignum(10))).toBe('0.0000001 ⓟ')
    expect(formatPhantomtoshi(new Bignum(PHANTOMTOSHI + 10012))).toBe(
      '1.00010012 ⓟ',
    )
  })
})
