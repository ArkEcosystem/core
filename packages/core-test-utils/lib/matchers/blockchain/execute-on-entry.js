'use strict'

const { isEqual, get } = require('lodash')

const toExecuteOnEntry = (machine, transition) => {
  let path = transition.state

  // For nested states, but only works 1 level depth
  if (transition.state.indexOf('.') !== -1) {
    const slugs = path.split('.')
    path = `${slugs[0]}.states.${slugs[1]}`
  }
  const state = get(machine.states, path)

  const actions = transition.actions.map(action => `"${action}"`).join(', ')

  return {
    // FIXME isNot is necessary to write the right message
    // @see https://facebook.github.io/jest/docs/en/expect.html#expectextendmatchers
    message: () => `Expected machine to ${this.isNot ? 'not ' : ''}call actions ${actions} on state "${transition.state}"`,
    pass: isEqual(state.onEntry, transition.actions)
  }
}

expect.extend({
  toExecuteOnEntry
})
