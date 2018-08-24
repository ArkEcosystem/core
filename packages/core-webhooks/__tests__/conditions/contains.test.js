const condition = require('../../lib/conditions/contains')

describe('Conditions - contains', () => {
  it('should be true', () => {
    expect(condition('Hello World', 'Hello')).toBeTrue()
  })

  it('should be false', () => {
    expect(condition('Hello World', 'invalid')).toBeFalse()
  })
})
