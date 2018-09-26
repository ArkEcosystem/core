const Machine = require('xstate').Machine

require('../../../lib/matchers/blockchain/execute-on-entry')

describe('.toExecuteOnEntry', () => {
  const machine = Machine({
    initial: 'a',
    states: {
      a: {
        onEntry: ['action-a'],
        on: {
          START: 'b'
        }
      },
      b: {
        on: {
          END: 'a'
        }
      }
    }
  })

  test('passes when the state machine executes all the actions when enters a state', () => {
    expect(machine).toExecuteOnEntry({ state: 'a', actions: ['action-a'] })
  })

  test('fails when the state machine does not execute all the actions when enters a state', () => {
    expect(machine).not.toExecuteOnEntry({ state: 'a', actions: ['no-action'] })
    expect(machine).not.toExecuteOnEntry({ state: 'b', actions: ['action-a'] })
    expect(machine).not.toExecuteOnEntry({ state: 'a', actions: ['action-a', 'no-action'] })
  })
})
