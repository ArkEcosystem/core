const condition = require('../../lib/conditions/truthy')

describe('Conditions - truthy', () => {
  it('should be true', () => {
    expect(condition(true)).toBeTrue()
  })

  it('should be false', () => {
    expect(condition(false)).toBeFalse()
  })
})
