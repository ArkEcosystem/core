'use strict'

const { matchesState } = require('xstate')

const toTransition = (machine, transition) => {
  const state = machine.transition(transition.from, transition.on)

  return {
    // FIXME isNot is necessary to write the right message
    // @see https://facebook.github.io/jest/docs/en/expect.html#expectextendmatchers
    message: () => `Expected machine to ${this.isNot ? 'not' : ''} transition to "${transition.to}" from "${transition.from}" on "${transition.on}"`,
    pass: matchesState(transition.to, state.value)
  }
}

expect.extend({
  toTransition
})
