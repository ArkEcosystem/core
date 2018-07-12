'use strict'

module.exports = (machine, transition) => {
  let state = machine.transition(transition.from, transition.on)

  // Ignore sub-machines
  if (typeof state.value !== 'string') {
    state.value = Object.keys(state.value)[0]
  }

  return {
    // FIXME isNot is necessary to write the right message
    // @see https://facebook.github.io/jest/docs/en/expect.html#expectextendmatchers
    message: () => `Expected machine to ${this.isNot ? 'not' : ''} transition to "${transition.to}" from "${transition.from}" on "${transition.on}"`,
    pass: state.value === transition.to
  }
}
