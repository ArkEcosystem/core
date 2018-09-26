'use strict'

const toDispatch = (received, dispatcher, arg) => {
  const mock = jest.fn()

  dispatcher.dispatch = mock
  received()

  const calls = dispatcher.dispatch.mock.calls
  const pass = calls && calls[0] ? Object.is(calls[0][0], arg) : false

  return {
    // FIXME isNot is necessary to write the right message
    // @see https://facebook.github.io/jest/docs/en/expect.html#expectextendmatchers
    message: () => `Expected "${arg}" to ${this.isNot ? 'not' : ''} be dispatched`,
    pass
  }
}

expect.extend({
  toDispatch
})
