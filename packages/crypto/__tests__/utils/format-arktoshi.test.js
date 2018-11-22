const { Bignum, formatPhantomtoshi } = require('../../lib/utils')
const { PHANTOMTOSHI } = require('../../lib/constants')

describe('Format Arktoshi', () => {
  it('should format phantomtoshis', () => {
    expect(formatPhantomtoshi(PHANTOMTOSHI)).toBe('1 Ẕ')
    expect(formatPhantomtoshi(0.1 * PHANTOMTOSHI)).toBe('0.1 Ẕ')
    expect(formatPhantomtoshi((0.1 * PHANTOMTOSHI).toString())).toBe('0.1 Ẕ')
    expect(formatPhantomtoshi(new Bignum(10))).toBe('0.0000001 Ẕ')
    expect(formatPhantomtoshi(new Bignum(PHANTOMTOSHI + 10012))).toBe(
      '1.00010012 Ẕ',
    )
  })
})
