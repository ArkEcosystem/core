'use strict'

module.exports = (received, [dispatcher, method, arg]) => {
  const mock = jest.fn()

  dispatcher[method] = mock
  received()

  const calls = dispatcher[method].mock.calls
  const pass = calls && calls[0] ? Object.is(calls[0][0], arg) : false

  return {
    // FIXME isNot is necessary to write the right message
    // @see https://facebook.github.io/jest/docs/en/expect.html#expectextendmatchers
    message: () => `Expected method "${method}" to ${this.isNot ? 'not' : ''} be called with ${arg}`,
    pass
  }
}
