const condition = require('../../lib/conditions/eq')

describe('Conditions - equal', () => {
  it('should be true', () => {
    expect(condition(1, 1)).toBeTrue()
  })

  it('should be false', () => {
    expect(condition(1, 2)).toBeFalse()
  })
})
