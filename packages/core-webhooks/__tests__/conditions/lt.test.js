const condition = require('../../lib/conditions/lt')

describe('Conditions - less than', () => {
  it('should be true', () => {
    expect(condition(1, 2)).toBeTrue()
  })

  it('should be false', () => {
    expect(condition(2, 1)).toBeFalse()
  })
})
