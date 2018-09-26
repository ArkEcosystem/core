'use strict'

require('@arkecosystem/core-test-utils/lib/matchers') // eslint-disable-line no-unused-vars

const machine = require('../../../lib/machines/blockchain')

describe('Blockchain machine > SyncWithNetwork', () => {
  it('should start with the `syncing` state', () => {
    expect(machine.states.syncWithNetwork).toHaveProperty('initial', 'syncing')
  })

  describe('state `syncing`', () => {
    it('should execute the `checkLastDownloadedBlockSynced` action when is entered', () => {
      expect(machine).toExecuteOnEntry({ state: 'syncWithNetwork.syncing', actions: ['checkLastDownloadedBlockSynced'] })
    })

    it('should transition to `downloadFinished` on `SYNCED`', () => {
      expect(machine).toTransition({ from: 'syncWithNetwork.syncing', on: 'SYNCED', to: 'syncWithNetwork.downloadFinished' })
    })

    it('should transition to `downloadBlocks` on `NOTSYNCED`', () => {
      expect(machine).toTransition({ from: 'syncWithNetwork.syncing', on: 'NOTSYNCED', to: 'syncWithNetwork.downloadBlocks' })
    })

    it('should transition to `downloadPaused` on `PAUSED`', () => {
      expect(machine).toTransition({ from: 'syncWithNetwork.syncing', on: 'PAUSED', to: 'syncWithNetwork.downloadPaused' })
    })

    it('should transition to `end` on `NETWORKHALTED`', () => {
      expect(machine).toTransition({ from: 'syncWithNetwork.syncing', on: 'NETWORKHALTED', to: 'syncWithNetwork.end' })
    })
  })

  describe('state `idle`', () => {
    it('should transition to `downloadBlocks` on `DOWNLOADED`', () => {
      expect(machine).toTransition({ from: 'syncWithNetwork.idle', on: 'DOWNLOADED', to: 'syncWithNetwork.downloadBlocks' })
    })
  })

  describe('state `downloadBlocks`', () => {
    it('should execute the `downloadBlocks` action when is entered', () => {
      expect(machine).toExecuteOnEntry({ state: 'syncWithNetwork.downloadBlocks', actions: ['downloadBlocks'] })
    })

    it('should transition to `syncing` on `DOWNLOADED`', () => {
      expect(machine).toTransition({ from: 'syncWithNetwork.downloadBlocks', on: 'DOWNLOADED', to: 'syncWithNetwork.syncing' })
    })

    it('should transition to `syncing` on `NOBLOCK`', () => {
      expect(machine).toTransition({ from: 'syncWithNetwork.downloadBlocks', on: 'NOBLOCK', to: 'syncWithNetwork.syncing' })
    })
  })

  describe('state `downloadFinished`', () => {
    it('should execute the `downloadFinished` action when is entered', () => {
      expect(machine).toExecuteOnEntry({ state: 'syncWithNetwork.downloadFinished', actions: ['downloadFinished'] })
    })

    it('should transition to `processFinished` on `PROCESSFINISHED`', () => {
      expect(machine).toTransition({ from: 'syncWithNetwork.downloadFinished', on: 'PROCESSFINISHED', to: 'syncWithNetwork.processFinished' })
    })
  })

  describe('state `downloadPaused`', () => {
    it('should execute the `downloadPaused` action when is entered', () => {
      expect(machine).toExecuteOnEntry({ state: 'syncWithNetwork.downloadPaused', actions: ['downloadPaused'] })
    })

    it('should transition to `processFinished` on `PROCESSFINISHED`', () => {
      expect(machine).toTransition({ from: 'syncWithNetwork.downloadPaused', on: 'PROCESSFINISHED', to: 'syncWithNetwork.processFinished' })
    })
  })

  describe('state `processFinished`', () => {
    it('should execute the `checkLastBlockSynced` action when is entered', () => {
      expect(machine).toExecuteOnEntry({ state: 'syncWithNetwork.processFinished', actions: ['checkLastBlockSynced'] })
    })

    it('should transition to `end` on `SYNCED`', () => {
      expect(machine).toTransition({ from: 'syncWithNetwork.processFinished', on: 'SYNCED', to: 'syncWithNetwork.end' })
    })

    it('should transition to `downloadBlocks` on `NOTSYNCED`', () => {
      expect(machine).toTransition({ from: 'syncWithNetwork.processFinished', on: 'NOTSYNCED', to: 'syncWithNetwork.downloadBlocks' })
    })
  })

  describe('state `end`', () => {
    it('should execute the `syncingComplete` action when is entered', () => {
      expect(machine).toExecuteOnEntry({ state: 'syncWithNetwork.end', actions: ['syncingComplete'] })
    })
  })
})
