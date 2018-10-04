'use strict'

const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')
const axiosMock = new MockAdapter(axios)
const delay = require('delay')

const { asValue } = require('awilix')
const { slots } = require('@arkecosystem/crypto')
const { Block } = require('@arkecosystem/crypto').models

const app = require('./__support__/setup')

let genesisBlock
let container
let blockchain
let logger
let loggerDebugBackup
let peerMock

const blocks1to100 = require('@arkecosystem/core-test-utils/fixtures/testnet/blocks.2-100')
const blocks101to155 = require('@arkecosystem/core-test-utils/fixtures/testnet/blocks.101-155')

beforeAll(async () => {
  container = await app.setUp()

  // Backup logger.debug function as we are going to mock it in the test suite
  logger = container.resolvePlugin('logger')
  loggerDebugBackup = logger.debug

  // Mock peer responses so that we can have blocks
  __mockPeer()

  // Manually register the blockchain and start it
  await __start()

  // Create the genesis block after the setup has finished or else it uses a potentially
  // wrong network config.
  genesisBlock = new Block(require('@arkecosystem/core-test-utils/config/testnet/genesisBlock.json'))
})

afterAll(async () => {
  axiosMock.reset()

  await __resetToHeight1()

  await app.tearDown()
})

afterEach(() => {
  // Restore original logger.debug function
  logger.debug = loggerDebugBackup
})

describe('Blockchain', () => {
  it('should be an object', () => {
    expect(blockchain).toBeObject()
  })

  describe('dispatch', () => {
    it('should be a function', () => {
      expect(blockchain.dispatch).toBeFunction()
    })

    it('should be ok', () => {
      const nextState = blockchain.dispatch('START')

      expect(blockchain.stateMachine.state.blockchain).toEqual(nextState)
    })
  })

  describe('start', () => {
    it('should be a function', () => {
      expect(blockchain.start).toBeFunction()
    })

    it('should be ok', async () => {
      process.env.ARK_SKIP_BLOCKCHAIN = false

      const started = await blockchain.start(true)

      expect(started).toBeTruthy()
    })
  })

  describe('checkNetwork', () => {
    it('should be a function', () => {
      expect(blockchain.checkNetwork).toBeFunction()
    })

    it('should throw an exception', () => {
      expect(() => blockchain.checkNetwork()).toThrowError('Method [checkNetwork] not implemented!')
    })
  })

  describe.skip('updateNetworkStatus', () => {
    it('should be a function', () => {
      expect(blockchain.updateNetworkStatus).toBeFunction()
    })
  })

  describe('rebuild', () => {
    it('should be a function', () => {
      expect(blockchain.rebuild).toBeFunction()
    })

    it('should throw an exception', () => {
      expect(() => blockchain.rebuild()).toThrowError('Method [rebuild] not implemented!')
    })
  })

  describe('resetState', () => {
    it('should be a function', () => {
      expect(blockchain.resetState).toBeFunction()
    })

    it('should be ok', async () => {
      const stateBackup = Object.assign({}, blockchain.stateMachine.state)

      await blockchain.resetState()

      expect(blockchain.stateMachine.state).toEqual({
        blockchain: blockchain.stateMachine.initialState,
        started: false,
        lastBlock: null,
        lastDownloadedBlock: null,
        blockPing: null,
        noBlockCounter: 0
      })

      blockchain.stateMachine.state = stateBackup
    })
  })

  describe('postTransactions', () => {
    it('should be a function', () => {
      expect(blockchain.postTransactions).toBeFunction()
    })

    it('should be ok', async () => {
      await blockchain.transactionPool.flush()
      await blockchain.postTransactions(genesisBlock.transactions, false)
      const transactions = await blockchain.transactionPool.getTransactions(0, 200)

      expect(transactions.length).toBe(genesisBlock.transactions.length)

      expect(transactions).toEqual(genesisBlock.transactions.map(transaction => transaction.serialized))

      await blockchain.transactionPool.flush()
    })
  })

  describe('queueBlock', () => {
    it('should be a function', () => {
      expect(blockchain.queueBlock).toBeFunction()
    })

    it('should be ok', async () => {
      const { Block } = require('@arkecosystem/crypto').models
      const block = new Block(blocks101to155[54])

      await blockchain.queueBlock(blocks101to155[54])

      expect(blockchain.stateMachine.state.lastDownloadedBlock).toEqual(block)
    })
  })

  describe('rollbackCurrentRound', () => {
    it('should be a function', () => {
      expect(blockchain.rollbackCurrentRound).toBeFunction()
    })

    it('should rollback', async () => {
      await blockchain.rollbackCurrentRound()
      expect(blockchain.getLastBlock().data.height).toBe(153)
    })
  })

  describe('removeBlocks', () => {
    it('should be a function', () => {
      expect(blockchain.removeBlocks).toBeFunction()
    })

    it('should remove blocks', async () => {
      const lastBlockHeight = blockchain.getLastBlock().data.height

      await blockchain.removeBlocks(2)
      expect(blockchain.getLastBlock().data.height).toBe(lastBlockHeight - 2)
    })
  })

  describe('rebuildBlock', () => {
    it('should be a function', () => {
      expect(blockchain.rebuildBlock).toBeFunction()
    })

    it('should rebuild with a known block', async () => {
      const mockCallback = jest.fn(() => true)
      const lastBlock = blockchain.getLastBlock()

      await blockchain.rebuildBlock(lastBlock, mockCallback)
      await delay(2000) // wait a bit to give enough time for the callback to be called

      expect(mockCallback.mock.calls.length).toBe(1)
    })

    it('should rebuild with a new chained block', async () => {
      const mockCallback = jest.fn(() => true)
      const lastBlock = blockchain.getLastBlock()

      await blockchain.removeBlocks(1) // remove 1 block so that we can add it then as a chained block

      expect(blockchain.getLastBlock()).not.toEqual(lastBlock)

      await blockchain.rebuildBlock(lastBlock, mockCallback)
      await delay(2000) // wait a bit to give enough time for the callback to be called

      expect(mockCallback.mock.calls.length).toBe(1)
      expect(blockchain.getLastBlock()).toEqual(lastBlock)
    })
  })

  describe('processBlock', () => {
    it('should be a function', () => {
      expect(blockchain.processBlock).toBeFunction()
    })

    it('should process a new chained block', async () => {
      const mockCallback = jest.fn(() => true)
      const lastBlock = blockchain.getLastBlock()

      await blockchain.removeBlocks(1) // remove 1 block so that we can add it then as a chained block

      expect(blockchain.getLastBlock()).not.toEqual(lastBlock)

      await blockchain.processBlock(lastBlock, mockCallback)
      await delay(2000) // wait a bit to give enough time for the callback to be called

      expect(mockCallback.mock.calls.length).toBe(1)
      expect(blockchain.getLastBlock()).toEqual(lastBlock)
    })

    it('should process a valid block already known', async () => {
      const mockCallback = jest.fn(() => true)
      const lastBlock = blockchain.getLastBlock()

      await blockchain.processBlock(lastBlock, mockCallback)
      await delay(2000) // wait a bit to give enough time for the callback to be called

      expect(mockCallback.mock.calls.length).toBe(1)
      expect(blockchain.getLastBlock()).toEqual(lastBlock)
    })
  })

  describe('acceptChainedBlock', () => {
    it('should be a function', () => {
      expect(blockchain.acceptChainedBlock).toBeFunction()
    })

    it('should process a new chained block', async () => {
      const lastBlock = blockchain.getLastBlock()

      await blockchain.removeBlocks(1) // remove 1 block so that we can add it then as a chained block

      expect(await blockchain.database.getLastBlock()).not.toEqual(lastBlock)

      await blockchain.acceptChainedBlock(lastBlock)

      expect(await blockchain.database.getLastBlock()).toEqual(lastBlock)

      // manually set blockchain.stateMachine.state.lastBlock because acceptChainedBlock doesn't do it
      blockchain.stateMachine.state.lastBlock = lastBlock
    })
  })

  describe('manageUnchainedBlock', () => {
    it('should be a function', () => {
      expect(blockchain.manageUnchainedBlock).toBeFunction()
    })

    it('should process a new unchained block', async () => {
      const mockLoggerDebug = jest.fn((message) => true)
      logger.debug = mockLoggerDebug

      const lastBlock = blockchain.getLastBlock()
      await blockchain.removeBlocks(2) // remove 2 blocks so that we can have _lastBlock_ as an unchained block
      await blockchain.manageUnchainedBlock(lastBlock)

      expect(mockLoggerDebug).toBeCalled()

      const debugMessage = `Blockchain not ready to accept new block at height ${lastBlock.data.height}. Last block: ${lastBlock.data.height - 2} :warning:`
      expect(mockLoggerDebug).lastCalledWith(debugMessage)

      expect(blockchain.getLastBlock().data.height).toBe(lastBlock.data.height - 2)
    })
  })

  describe('getUnconfirmedTransactions', () => {
    it('should be a function', () => {
      expect(blockchain.getUnconfirmedTransactions).toBeFunction()
    })

    it('should get unconfirmed transactions', async () => {
      await blockchain.transactionPool.flush()
      await blockchain.postTransactions(genesisBlock.transactions, false)
      const unconfirmedTransactions = await blockchain.getUnconfirmedTransactions(200)

      expect(unconfirmedTransactions.transactions.length).toBe(genesisBlock.transactions.length)

      expect(unconfirmedTransactions.transactions).toEqual(genesisBlock.transactions.map(transaction => transaction.serialized))

      await blockchain.transactionPool.flush()
    })
  })

  describe('isSynced', () => {
    it('should be a function', () => {
      expect(blockchain.isSynced).toBeFunction()
    })

    describe('with a block param', () => {
      it('should be ok', () => {
        expect(blockchain.isSynced({ data: {
          timestamp: slots.getTime(),
          height: genesisBlock.height
        } })).toBeTruthy()
      })
    })

    xdescribe('without a block param', () => {
      it('should use the last block', () => {
        blockchain.getLastBlock = jest.fn(() => ({
          timestamp: slots.getTime() - genesisBlock.timestamp,
          height: genesisBlock.height
        }))
        expect(blockchain.isSynced()).toBeTruthy()
        expect(blockchain.getLastBlock()).toHaveBeenCalledWith(true)
      })
    })
  })

  describe('isRebuildSynced', () => {
    it('should be a function', () => {
      expect(blockchain.isRebuildSynced).toBeFunction()
    })

    describe('with a block param', () => {
      it('should be ok', () => {
        expect(blockchain.isRebuildSynced({ data: {
          timestamp: slots.getTime() - 3600 * 24 * 6,
          height: blocks101to155[52].height
        } })).toBeTruthy()
      })
    })

    xdescribe('without a block param', () => {
      it('should use the last block', () => {
        blockchain.getLastBlock = jest.fn(() => ({
          timestamp: slots.getTime() - genesisBlock.timestamp,
          height: genesisBlock.height
        }))
        expect(blockchain.isRebuildSynced()).toBeTruthy()
        expect(blockchain.getLastBlock()).toHaveBeenCalledWith(true)
      })
    })
  })

  describe('getLastBlock', () => {
    it('should be a function', () => {
      expect(blockchain.getLastBlock).toBeFunction()
    })

    it('should be ok', () => {
      blockchain.stateMachine.state.lastBlock = genesisBlock

      expect(blockchain.getLastBlock()).toEqual(genesisBlock)
    })
  })

  describe('__isChained', () => {
    it('should be a function', () => {
      expect(blockchain.__isChained).toBeFunction()
    })

    it('should be ok', () => {
      const previousBlock = {
        data: {
          id: 1,
          timestamp: 1,
          height: 1
        }
      }

      const nextBlock = {
        data: {
          id: 2,
          timestamp: 2,
          height: 2,
          previousBlock: 1
        }
      }

      expect(blockchain.__isChained(previousBlock, nextBlock)).toBeTruthy()
    })

    it('should not be ok', () => {
      const previousBlock = {
        data: {
          id: 2,
          timestamp: 2,
          height: 2
        }
      }

      const nextBlock = {
        data: {
          id: 1,
          timestamp: 1,
          height: 1,
          previousBlock: 1
        }
      }

      expect(blockchain.__isChained(previousBlock, nextBlock)).toBeFalsy()
    })
  })

  describe('__registerQueue', () => {
    it('should be a function', () => {
      expect(blockchain.__registerQueue).toBeFunction()
    })

    it('should be ok', () => {
      blockchain.__registerQueue()

      expect(blockchain).toHaveProperty('queue')
      expect(blockchain).toHaveProperty('processQueue')
      expect(blockchain).toHaveProperty('rebuildQueue')
    })
  })
})

async function __start () {
  process.env.ARK_SKIP_BLOCKCHAIN = false
  process.env.ARK_ENV = false

  const plugin = require('../lib').plugin

  blockchain = await plugin.register(container, {
    networkStart: false
  })

  await container.register('blockchain', asValue({
    name: 'blockchain',
    version: '0.1.0',
    plugin: blockchain,
    options: {}
  }))

  const p2p = container.resolvePlugin('p2p')
  await p2p.acceptNewPeer(peerMock)

  await __resetToHeight1()

  await blockchain.start(true)
  while (!blockchain.getLastBlock() || blockchain.getLastBlock().data.height < 155) {
    await delay(1000)
  }
}

async function __resetToHeight1 () {
  const lastBlock = await blockchain.database.getLastBlock()
  if (lastBlock) {
    blockchain.stateMachine.state.lastBlock = lastBlock
    await blockchain.removeBlocks(lastBlock.data.height - 1)
  }
}

function __mockPeer () {
  // Mocking a peer which will send blocks until height 155
  const Peer = require('@arkecosystem/core-p2p/lib/peer')
  peerMock = new Peer('0.0.0.99', 4002)
  Object.assign(peerMock, peerMock.headers, { status: 200 })

  axiosMock.onGet(/.*\/peer\/blocks\/common.*/).reply(() => [200, { status: 200, success: true, common: true }, peerMock.headers])
  axiosMock.onGet(/.*\/peer\/blocks/).reply((config) => {
    const blocks = config.params.lastBlockHeight === 1 ? blocks1to100
      : config.params.lastBlockHeight === 100 ? blocks101to155 : []

    return [200, { status: 200, success: true, blocks }, peerMock.headers]
  })
  axiosMock.onGet(/.*\/peer\/status/).reply(() => [200, { status: 200, success: true, height: 155 }, peerMock.headers])
  axiosMock.onGet(/.*\/peer\/list/).reply(() => [200, { success: true, peers: [ { status: 200, ip: peerMock.ip, port: 4002, height: 155, delay: 8 } ] }, peerMock.headers])
}
