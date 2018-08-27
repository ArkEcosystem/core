const condition = require('../../lib/conditions/gt')

describe('Conditions - greater than', () => {
  it('should be true', () => {
    expect(condition(2, 1)).toBeTrue()
  })

  it('should be false', () => {
    expect(condition(1, 2)).toBeFalse()
  })
})
