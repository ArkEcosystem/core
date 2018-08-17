const condition = require('../../lib/conditions/regexp')

describe('Conditions - regexp', () => {
  it('should be true', () => {
    expect(condition('hello world!', 'hello')).toBeTrue()
  })

  it('should be false', () => {
    expect(condition(123, 'w+')).toBeFalse()
  })
})
