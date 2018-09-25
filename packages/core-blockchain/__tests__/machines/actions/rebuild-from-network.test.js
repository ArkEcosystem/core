'use strict'

require('@arkecosystem/core-test-utils/lib/matchers') // eslint-disable-line no-unused-vars

const machine = require('../../../lib/machines/blockchain')

describe('Blockchain machine > Rebuilding', () => {
  it('should start with the `rebuilding` state', () => {
    expect(machine.states.rebuild).toHaveProperty('initial', 'rebuilding')
  })

  describe('state `rebuilding`', () => {
    it('should execute the `checkLastDownloadedBlockSynced` action when is entered', () => {
      expect(machine).toExecuteOnEntry({ state: 'rebuild.rebuilding', actions: ['checkLastDownloadedBlockSynced'] })
    })

    it('should transition to `waitingFinished` on `SYNCED`', () => {
      expect(machine).toTransition({ from: 'rebuild.rebuilding', on: 'SYNCED', to: 'rebuild.waitingFinished' })
    })

    it('should transition to `revertBlocks` on `NOTSYNCED`', () => {
      expect(machine).toTransition({ from: 'rebuild.rebuilding', on: 'NOTSYNCED', to: 'rebuild.rebuildBlocks' })
    })

    it('should transition to `rebuildPaused` on `PAUSED`', () => {
      expect(machine).toTransition({ from: 'rebuild.rebuilding', on: 'PAUSED', to: 'rebuild.rebuildPaused' })
    })
  })

  describe('state `idle`', () => {
    it('should transition to `rebuildBlocks` on `DOWNLOADED`', () => {
      expect(machine).toTransition({ from: 'rebuild.idle', on: 'DOWNLOADED', to: 'rebuild.rebuildBlocks' })
    })
  })

  describe('state `rebuildBlocks`', () => {
    it('should execute the `rebuildBlocks` action when is entered', () => {
      expect(machine).toExecuteOnEntry({ state: 'rebuild.rebuildBlocks', actions: ['rebuildBlocks'] })
    })

    it('should transition to `rebuilding` on `DOWNLOADED`', () => {
      expect(machine).toTransition({ from: 'rebuild.rebuildBlocks', on: 'DOWNLOADED', to: 'rebuild.rebuilding' })
    })

    it('should transition to `rebuilding` on `NOBLOCK`', () => {
      expect(machine).toTransition({ from: 'rebuild.rebuildBlocks', on: 'NOBLOCK', to: 'rebuild.rebuilding' })
    })
  })

  describe('state `waitingFinished`', () => {
    it('should transition to `rebuildFinished` on `REBUILDFINISHED`', () => {
      expect(machine).toTransition({ from: 'rebuild.waitingFinished', on: 'REBUILDFINISHED', to: 'rebuild.rebuildFinished' })
    })
  })

  describe('state `processFinished`', () => {
    it('should execute the `checkRebuildBlockSynced` action when is entered', () => {
      expect(machine).toExecuteOnEntry({ state: 'rebuild.processFinished', actions: ['checkRebuildBlockSynced'] })
    })

    it('should transition to `processFinished` on `SYNCED`', () => {
      expect(machine).toTransition({ from: 'rebuild.processFinished', on: 'SYNCED', to: 'rebuild.end' })
    })

    it('should transition to `processFinished` on `NOTSYNCED`', () => {
      expect(machine).toTransition({ from: 'rebuild.processFinished', on: 'NOTSYNCED', to: 'rebuild.rebuildBlocks' })
    })
  })

  describe('state `rebuildPaused`', () => {
    it('should execute the `downloadPaused` action when is entered', () => {
      expect(machine).toExecuteOnEntry({ state: 'rebuild.rebuildPaused', actions: ['downloadPaused'] })
    })

    it('should transition to `processFinished` on `REBUILDFINISHED`', () => {
      expect(machine).toTransition({ from: 'rebuild.rebuildPaused', on: 'REBUILDFINISHED', to: 'rebuild.processFinished' })
    })
  })

  describe('state `rebuildFinished`', () => {
    it('should execute the `rebuildFinished` action when is entered', () => {
      expect(machine).toExecuteOnEntry({ state: 'rebuild.rebuildFinished', actions: ['rebuildFinished'] })
    })

    it('should transition to `processFinished` on `PROCESSFINISHED`', () => {
      expect(machine).toTransition({ from: 'rebuild.rebuildFinished', on: 'PROCESSFINISHED', to: 'rebuild.processFinished' })
    })
  })

  describe('state `end`', () => {
    it('should execute the `rebuildingComplete` action when is entered', () => {
      expect(machine).toExecuteOnEntry({ state: 'rebuild.end', actions: ['rebuildingComplete'] })
    })
  })
})
