const condition = require('../../lib/conditions/gte')

describe('Conditions - greater than or equal', () => {
  it('should be true', () => {
    expect(condition(2, 1)).toBeTrue()
    expect(condition(2, 2)).toBeTrue()
  })

  it('should be false', () => {
    expect(condition(1, 2)).toBeFalse()
  })
})
