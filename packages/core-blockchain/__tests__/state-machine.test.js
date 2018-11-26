require('@arkecosystem/core-test-utils/lib/matchers') // eslint-disable-line no-unused-vars

const { asValue } = require('awilix')

const app = require('./__support__/setup')

let stateMachine
let container
let blockchain

beforeAll(async () => {
  container = await app.setUp()

  process.env.ARK_SKIP_BLOCKCHAIN = true

  // Manually register the blockchain
  const plugin = require('../lib').plugin

  blockchain = await plugin.register(container, {
    networkStart: false,
  })

  await container.register(
    'blockchain',
    asValue({
      name: 'blockchain',
      version: '0.1.0',
      plugin: blockchain,
      options: {},
    }),
  )

  stateMachine = require('../lib/state-machine')
})

afterAll(async () => {
  // Manually stop  the blockchain
  await blockchain.stop()

  await app.tearDown()
})

beforeEach(async () => {
  process.env.ARK_SKIP_BLOCKCHAIN = false
  blockchain.resetState()
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

      it('should dispatch the event "WAKEUP" after a delay', async () => {
        jest.useFakeTimers()
        blockchain.dispatch = jest.fn()

        actionMap.checkLater()
        expect(blockchain.dispatch).not.toBeCalled()

        jest.runAllTimers()
        expect(blockchain.dispatch).toHaveBeenCalled()
        expect(blockchain.dispatch).toHaveBeenCalledWith('WAKEUP')

        jest.useRealTimers() // restore standard timers
      })
    })

    describe('checkLastBlockSynced', () => {
      it('should be a function', () => {
        expect(actionMap.checkLastBlockSynced).toBeFunction()
      })

      it('should dispatch the event "SYNCED" if the blockchain is synced', () => {
        blockchain.isSynced = jest.fn(() => true)
        expect(actionMap.checkLastBlockSynced).toDispatch(blockchain, 'SYNCED')
      })

      it('should dispatch the event "NOTSYNCED" if the blockchain is not synced', () => {
        blockchain.isSynced = jest.fn(() => false)
        expect(() => actionMap.checkLastBlockSynced()).toDispatch(
          blockchain,
          'NOTSYNCED',
        )
      })
    })

    describe('checkRebuildBlockSynced', () => {
      it('should be a function', () => {
        expect(actionMap.checkRebuildBlockSynced).toBeFunction()
      })

      it('should dispatch the event "SYNCED" if the blockchain is synced after a rebuild', () => {
        blockchain.isRebuildSynced = jest.fn(() => true)
        expect(() => actionMap.checkRebuildBlockSynced()).toDispatch(
          blockchain,
          'SYNCED',
        )
      })

      it('should dispatch the event "NOTSYNCED" if the blockchain is not synced after a rebuild', () => {
        blockchain.isRebuildSynced = jest.fn(() => false)
        expect(() => actionMap.checkRebuildBlockSynced()).toDispatch(
          blockchain,
          'NOTSYNCED',
        )
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

      describe('if the network has started', () => {
        it('should dispatch the event "SYNCFINISHED"', () => {
          stateMachine.state.networkStart = true
          expect(actionMap.downloadFinished).toDispatch(
            blockchain,
            'SYNCFINISHED',
          )
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
          expect(() => actionMap.downloadFinished()).not.toDispatch([
            blockchain,
            'SYNCFINISHED',
          ])
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

      it('should dispatch the event "SYNCFINISHED"', () => {
        expect(() => actionMap.syncingComplete()).toDispatch(
          blockchain,
          'SYNCFINISHED',
        )
      })
    })

    describe('rebuildingComplete', () => {
      it('should be a function', () => {
        expect(actionMap.rebuildingComplete).toBeFunction()
      })

      it('should dispatch the event "REBUILDCOMPLETE"', () => {
        expect(() => actionMap.rebuildingComplete()).toDispatch(
          blockchain,
          'REBUILDCOMPLETE',
        )
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
