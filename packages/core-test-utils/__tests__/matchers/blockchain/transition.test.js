const Machine = require('xstate').Machine

require('../../../lib/matchers/blockchain/transition')

describe('.toTransition', () => {
  const machine = Machine({
    initial: 'a',
    states: {
      a: {
        on: {
          START: 'b',
          SUB: 'c'
        }
      },
      b: {
        on: {
          END: 'a'
        }
      },
      c: {
        on: {
          END: 'a'
        },
        initial: 'c-1',
        states: {
          'c-1': {
            on: {
              BACK: 'b'
            }
          }
        }
      }
    }
  })

  test('passes when the state machine transitions from one state to other on an event', () => {
    expect(machine).toTransition({ from: 'a', on: 'START', to: 'b' })
  })

  test('passes when the state machine transitions from one state to other on an event, even sub-states', () => {
    expect(machine).toTransition({ from: 'a', on: 'SUB', to: 'c' })
  })

  test('fails when the state machine does not transition from one state to other on an event', () => {
    expect(machine).not.toTransition({ from: 'a', on: 'FAKE', to: 'b' })
    expect(machine).not.toTransition({ from: 'a', on: 'END', to: 'b' })
  })
})
