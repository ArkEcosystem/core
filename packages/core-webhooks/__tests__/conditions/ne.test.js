const condition = require('../../lib/conditions/ne')

describe('Conditions - not equal', () => {
  it('should be true', () => {
    expect(condition(1, 2)).toBeTrue()
  })

  it('should be false', () => {
    expect(condition(1, 1)).toBeFalse()
  })
})
