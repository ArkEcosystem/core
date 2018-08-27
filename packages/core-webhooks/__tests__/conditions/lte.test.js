const condition = require('../../lib/conditions/lte')

describe('Conditions - less than or equal', () => {
  it('should be true', () => {
    expect(condition(1, 2)).toBeTrue()
    expect(condition(1, 1)).toBeTrue()
  })

  it('should be false', () => {
    expect(condition(2, 1)).toBeFalse()
  })
})
