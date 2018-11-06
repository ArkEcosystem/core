'use strict'

require('@arkecosystem/core-test-utils/lib/matchers') // eslint-disable-line no-unused-vars

const machine = require('../../../lib/machines/blockchain')

describe('Blockchain machine > Fork', () => {
  it('should start with the `analysing` state', () => {
    expect(machine.states.fork).toHaveProperty('initial', 'analysing')
  })

  describe('state `analysing`', () => {
    it('should execute the `analyseFork` action when is entered', () => {
      expect(machine).toExecuteOnEntry({ state: 'fork.analysing', actions: ['analyseFork'] })
    })

    it('should transition to `revertBlocks` on `REBUILD`', () => {
      expect(machine).toTransition({ from: 'fork.analysing', on: 'REBUILD', to: 'fork.revertBlocks' })
    })

    it('should transition to `exit` on `NOFORK`', () => {
      expect(machine).toTransition({ from: 'fork.analysing', on: 'NOFORK', to: 'fork.exit' })
    })
  })

  describe('state `network`', () => {
    it('should execute the `checkNetwork` action when is entered', () => {
      expect(machine).toExecuteOnEntry({ state: 'fork.network', actions: ['checkNetwork'] })
    })
  })

  describe('state `exit`', () => {
    it('should execute the `forkRecovered` action when is entered', () => {
      expect(machine).toExecuteOnEntry({ state: 'fork.exit', actions: ['forkRecovered'] })
    })
  })
})
