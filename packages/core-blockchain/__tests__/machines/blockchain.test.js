'use strict'

require('@arkecosystem/core-test-utils/lib/matchers') // eslint-disable-line no-unused-vars

const machine = require('../../lib/machines/blockchain')

describe('Blockchain machine', () => {
  it('should use `blockchain` as the key', () => {
    expect(machine).toHaveProperty('key', 'blockchain')
  })

  it('should start with the `uninitialised` state', () => {
    expect(machine.initialState).toHaveProperty('value', 'uninitialised')
  })

  describe('state `uninitialised`', () => {
    it('should transition to `init` on `START`', () => {
      expect(machine).toTransition({ from: 'uninitialised', on: 'START', to: 'init' })
    })
  })

  describe('state `init`', () => {
    it('should execute the `init` action when is entered', () => {
      expect(machine).toExecuteOnEntry({ state: 'init', actions: ['init'] })
    })

    it('should transition to `rebuild` on `REBUILD`', () => {
      expect(machine).toTransition({ from: 'init', on: 'REBUILD', to: 'rebuild' })
    })

    it('should transition to `rebuild` on `NETWORKSTART`', () => {
      expect(machine).toTransition({ from: 'init', on: 'NETWORKSTART', to: 'idle' })
    })

    it('should transition to `rebuild` on `STARTED`', () => {
      expect(machine).toTransition({ from: 'init', on: 'STARTED', to: 'syncWithNetwork' })
    })

    it('should transition to `rebuild` on `FAILURE`', () => {
      expect(machine).toTransition({ from: 'init', on: 'FAILURE', to: 'exit' })
    })
  })

  describe('state `rebuild`', () => {
    it('should transition to `syncWithNetwork` on `REBUILDCOMPLETE`', () => {
      expect(machine).toTransition({ from: 'rebuild', on: 'REBUILDCOMPLETE', to: 'syncWithNetwork' })
    })

    it('should transition to `fork` on `FORK`', () => {
      expect(machine).toTransition({ from: 'rebuild', on: 'FORK', to: 'fork' })
    })
  })

  describe('state `syncWithNetwork`', () => {
    it('should transition to `idle` on `TEST`', () => {
      expect(machine).toTransition({ from: 'syncWithNetwork', on: 'TEST', to: 'idle' })
    })

    it('should transition to `idle` on `SYNCFINISHED`', () => {
      expect(machine).toTransition({ from: 'syncWithNetwork', on: 'SYNCFINISHED', to: 'idle' })
    })

    it('should transition to `fork` on `FORK`', () => {
      expect(machine).toTransition({ from: 'syncWithNetwork', on: 'FORK', to: 'fork' })
    })
  })

  describe('state `idle`', () => {
    it('should execute the `checkLater` and `blockchainReady` actions when is entered', () => {
      expect(machine).toExecuteOnEntry({ state: 'idle', actions: ['checkLater', 'blockchainReady'] })
    })

    it('should transition to `syncWithNetwork` on `WAKEUP`', () => {
      expect(machine).toTransition({ from: 'idle', on: 'WAKEUP', to: 'syncWithNetwork' })
    })

    it('should transition to `processingBlock` on `NEWBLOCK`', () => {
      expect(machine).toTransition({ from: 'idle', on: 'NEWBLOCK', to: 'processingBlock' })
    })

    it('should transition to `stopped` on `STOP`', () => {
      expect(machine).toTransition({ from: 'idle', on: 'STOP', to: 'stopped' })
    })
  })

  describe('state `processingBlock`', () => {
    it('should execute the `processBlock` action when is entered', () => {
      expect(machine).toExecuteOnEntry({ state: 'processingBlock', actions: ['processBlock'] })
    })

    it('should transition to `idle` on `SUCCESS`', () => {
      expect(machine).toTransition({ from: 'processingBlock', on: 'SUCCESS', to: 'idle' })
    })

    it('should transition to `fork` on `FAILURE`', () => {
      expect(machine).toTransition({ from: 'processingBlock', on: 'FAILURE', to: 'fork' })
    })
  })

  describe('state `fork`', () => {
    it('should execute the `processBlock` action when is entered', () => {
      expect(machine).toExecuteOnEntry({ state: 'fork', actions: ['startForkRecovery'] })
    })

    it('should transition to `idle` on `SUCCESS`', () => {
      expect(machine).toTransition({ from: 'fork', on: 'SUCCESS', to: 'syncWithNetwork' })
    })

    it('should transition to `fork` on `FAILURE`', () => {
      expect(machine).toTransition({ from: 'fork', on: 'FAILURE', to: 'exit' })
    })
  })

  describe('state `stopped`', () => {
    it('should execute the `stopped` action when is entered', () => {
      expect(machine).toExecuteOnEntry({ state: 'stopped', actions: ['stopped'] })
    })
  })

  describe('state `exit`', () => {
    it('should execute the `exitApp` action when is entered', () => {
      expect(machine).toExecuteOnEntry({ state: 'exit', actions: ['exitApp'] })
    })
  })
})
