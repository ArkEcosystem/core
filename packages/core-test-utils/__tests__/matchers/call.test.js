expect.extend({
  toCall: require('../../lib/matchers/call')
})

describe('.toCall', () => {
  const dispatcher = {
    dispatch (event) {
      return event
    }
  }

  test('passes when the method is called with the argument', () => {
    expect(() => dispatcher.dispatch('EVENT')).toCall([dispatcher, 'dispatch', 'EVENT'])
  })

  test('fails when the method is not called with the argument', () => {
    expect(() => {}).not.toCall([dispatcher, 'dispatch', 'FAKE-EVENT'])
  })
})
