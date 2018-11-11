const condition = require('../../lib/conditions/not-between')

describe('Conditions - not-between', () => {
  it('should be true', () => {
    expect(
      condition(3, {
        min: 1,
        max: 2,
      }),
    ).toBeTrue()
  })

  it('should be false', () => {
    expect(
      condition(1.5, {
        min: 1,
        max: 2,
      }),
    ).toBeFalse()
  })
})
