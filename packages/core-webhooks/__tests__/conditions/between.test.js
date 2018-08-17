const condition = require('../../lib/conditions/between')

describe('Conditions - between', () => {
  it('should be true', () => {
    expect(condition(1.5, 1, 2)).toBeTrue()
  })

  it('should be false', () => {
    expect(condition(3, 1, 2)).toBeFalse()
  })
})
