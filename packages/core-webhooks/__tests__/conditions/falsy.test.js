const condition = require('../../lib/conditions/falsy')

describe('Conditions - falsy', () => {
  it('should be true', () => {
    expect(condition(false)).toBeTrue()
  })

  it('should be false', () => {
    expect(condition(true)).toBeFalse()
  })
})
