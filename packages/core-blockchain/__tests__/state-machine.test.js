'use strict'

const { asValue } = require('awilix')

const app = require('./__support__/setup')

// TODO as dependency on package.json?
const testUtils = require('@arkecosystem/core-test-utils/lib') // eslint-disable-line no-unused-vars

let stateMachine
let container
let blockchain

beforeAll(async (done) => {
  container = await app.setUp()

  stateMachine = require('../lib/state-machine')

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

beforeEach(async (done) => {
  process.env.ARK_SKIP_BLOCKCHAIN = true

  // manually register the blockchain
  const plugin = require('../lib').plugin

  blockchain = await plugin.register(container, {
    networkStart: false
  })

  await container.register('blockchain', asValue({
    name: 'blockchain',
    version: '0.0.1',
    plugin: blockchain,
    options: {}
  }))

  done()
})

afterEach(async (done) => {
  process.env.ARK_SKIP_BLOCKCHAIN = false

  await blockchain.resetState()

  done()
})

describe('State Machine', () => {
  it('should be an object', () => {
    expect(stateMachine).toBeObject()
  })

  describe('actionMap', () => {
    let actionMap

    beforeEach(() => {
      actionMap = stateMachine.actionMap(blockchain)
    })

    describe('checkLater', () => {
      it('should be a function', () => {
        expect(actionMap.checkLater).toBeFunction()
      })

      xit('should dispatch the event "WAKEUP" after a delay', async () => {
        await expect(() => actionMap.checkLater()).toCall([blockchain, 'dispatch', 'WAKEUP'])
      })
    })

    describe('checkLastBlockSynced', () => {
      it('should be a function', () => {
        expect(actionMap.checkLastBlockSynced).toBeFunction()
      })

      it('should dispatch the event "SYNCED" if the blockchain is synced', () => {
        blockchain.isSynced = jest.fn(() => true)
        expect(() => actionMap.checkLastBlockSynced()).toCall([blockchain, 'dispatch', 'SYNCED'])
      })

      it('should dispatch the event "NOTSYNCED" if the blockchain is not synced', () => {
        blockchain.isSynced = jest.fn(() => false)
        expect(() => actionMap.checkLastBlockSynced()).toCall([blockchain, 'dispatch', 'NOTSYNCED'])
      })
    })

    describe('checkRebuildBlockSynced', () => {
      it('should be a function', () => {
        expect(actionMap.checkRebuildBlockSynced).toBeFunction()
      })

      it('should dispatch the event "SYNCED" if the blockchain is synced after a rebuild', () => {
        blockchain.isRebuildSynced = jest.fn(() => true)
        expect(() => actionMap.checkRebuildBlockSynced()).toCall([blockchain, 'dispatch', 'SYNCED'])
      })

      it('should dispatch the event "NOTSYNCED" if the blockchain is not synced after a rebuild', () => {
        blockchain.isRebuildSynced = jest.fn(() => false)
        expect(() => actionMap.checkRebuildBlockSynced()).toCall([blockchain, 'dispatch', 'NOTSYNCED'])
      })
    })

    describe('checkLastDownloadedBlockSynced', () => {
      it('should be a function', () => {
        expect(actionMap.checkLastDownloadedBlockSynced).toBeFunction()
      })
    })

    describe('downloadFinished', () => {
      it('should be a function', () => {
        expect(actionMap.downloadFinished).toBeFunction()
      })

      xdescribe('if the network has started', () => {
        it('should dispatch the event "SYNCFINISHED"', () => {
          stateMachine.state.networkStart = true
          expect(() => actionMap.downloadFinished()).toCall([blockchain, 'dispatch', 'SYNCFINISHED'])
        })

        it('should toggle its state', () => {
          stateMachine.state.networkStart = true
          actionMap.downloadFinished()
          expect(stateMachine.state.networkStart).toBe(false)
        })
      })

      describe('if the network has not started', () => {
        it('should not do anything', () => {
          stateMachine.state.networkStart = false
          expect(() => actionMap.downloadFinished()).not.toCall([blockchain, 'dispatch', 'SYNCFINISHED'])
          expect(stateMachine.state.networkStart).toBe(false)
        })
      })
    })

    describe('rebuildFinished', () => {
      it('should be a function', () => {
        expect(actionMap.rebuildFinished).toBeFunction()
      })
    })

    describe('downloadPaused', () => {
      it('should be a function', () => {
        expect(actionMap.downloadPaused).toBeFunction()
      })
    })

    describe('downloadPaused', () => {
      it('should be a function', () => {
        expect(actionMap.downloadPaused).toBeFunction()
      })

      it('should dispatch the event "SYNCFINISHED"', () => {
        expect(() => actionMap.syncingComplete()).toCall([blockchain, 'dispatch', 'SYNCFINISHED'])
      })
    })

    describe('rebuildingComplete', () => {
      it('should be a function', () => {
        expect(actionMap.rebuildingComplete).toBeFunction()
      })

      it('should dispatch the event "REBUILDFINISHED"', () => {
        expect(() => actionMap.rebuildingComplete()).toCall([blockchain, 'dispatch', 'REBUILDFINISHED'])
      })
    })

    describe('exitApp', () => {
      it('should be a function', () => {
        expect(actionMap.exitApp).toBeFunction()
      })
    })

    describe('init', () => {
      it('should be a function', () => {
        expect(actionMap.init).toBeFunction()
      })
    })

    describe('rebuildBlocks', () => {
      it('should be a function', () => {
        expect(actionMap.rebuildBlocks).toBeFunction()
      })
    })

    describe('downloadBlocks', () => {
      it('should be a function', () => {
        expect(actionMap.downloadBlocks).toBeFunction()
      })
    })

    describe('analyseFork', () => {
      it('should be a function', () => {
        expect(actionMap.analyseFork).toBeFunction()
      })
    })

    describe('startForkRecovery', () => {
      it('should be a function', () => {
        expect(actionMap.startForkRecovery).toBeFunction()
      })
    })
  })
})
