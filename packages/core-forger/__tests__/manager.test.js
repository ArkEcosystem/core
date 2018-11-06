'use strict'

const app = require('./__support__/setup')
const defaultConfig = require('../lib/defaults')
const delegate = require('./__fixtures__/delegate')
const sampleTransaction = require('./__fixtures__/transaction')
const sampleBlock = require('./__fixtures__/block')
const { Delegate, Transaction } = require('@arkecosystem/crypto').models

jest.setTimeout(30000)
jest.mock('../lib/client')

let forgeManager

beforeAll(async () => {
  await app.setUp()
})

afterAll(async () => {
  await app.tearDown()
  jest.restoreAllMocks()
})

beforeEach(() => {
  const ForgeManager = require('../lib/manager')
  defaultConfig.hosts = [`http://127.0.0.1:${process.env.ARK_P2P_PORT || 4000}`]
  forgeManager = new ForgeManager(defaultConfig)
})

describe('Forger Manager', () => {
  describe('loadDelegates', () => {
    it('should be a function', () => {
      expect(forgeManager.loadDelegates).toBeFunction()
    })

    it('should be ok with configured delegates', async () => {
      let secret = 'a secret'
      forgeManager.secrets = [secret]
      forgeManager.client.getUsernames.mockReturnValue([])

      const delegates = await forgeManager.loadDelegates()

      expect(delegates).toBeArray()
      delegates.forEach(delegate => expect(delegate).toBeInstanceOf(Delegate))
      expect(forgeManager.client.getUsernames).toHaveBeenCalled()
    })
  })

  describe('startForging', () => {
    it('should be a function', () => {
      expect(forgeManager.startForging).toBeFunction()
    })
  })

  describe('__forgeNewBlock', () => {
    it('should be a function', () => {
      expect(forgeManager.__forgeNewBlock).toBeFunction()
    })
    it('should forge a block', async () => {
      forgeManager.client.getTransactions.mockReturnValue({
        transactions: [ Transaction.serialize(sampleTransaction).toString('hex') ]
      })
      forgeManager.usernames = []
      const del = new Delegate('a secret', 100)
      const round = {
        lastBlock: { id: sampleBlock.data.id, height: sampleBlock.data.height },
        timestamp: 1,
        reward: 2
      }

      await forgeManager.__forgeNewBlock(del, round)

      expect(forgeManager.client.broadcast).toHaveBeenCalledWith(expect.objectContaining({
        height: round.lastBlock.height + 1,
        reward: round.reward
      }))
      expect(forgeManager.client.emitEvent).toHaveBeenCalledWith('block.forged', expect.any(Object))
      expect(forgeManager.client.emitEvent).toHaveBeenCalledWith('transaction.forged', expect.any(Object))
    })
  })

  describe('__monitor', () => {
    it('should be a function', () => {
      expect(forgeManager.__monitor).toBeFunction()
    })
    it('should emit failed event if error while monitoring', async () => {
      forgeManager.client.getUsernames.mockRejectedValue(new Error('oh bollocks'))

      setTimeout(() => forgeManager.stop(), 1000)
      await forgeManager.__monitor()

      expect(forgeManager.client.emitEvent).toHaveBeenCalledWith('forger.failed', 'oh bollocks')
    })
  })

  describe('__getTransactionsForForging', () => {
    it('should be a function', () => {
      expect(forgeManager.__getTransactionsForForging).toBeFunction()
    })
    it('should return zero transactions if none to forge', async () => {
      forgeManager.client.getTransactions.mockReturnValue({})

      const transactions = await forgeManager.__getTransactionsForForging()

      expect(transactions).toHaveLength(0)
      expect(forgeManager.client.getTransactions).toHaveBeenCalled()
    })
    it('should return deserialized transactions', async () => {
      forgeManager.client.getTransactions.mockReturnValue({
        transactions: [ Transaction.serialize(sampleTransaction).toString('hex') ]
      })

      const transactions = await forgeManager.__getTransactionsForForging()

      expect(transactions).toHaveLength(1)
      expect(forgeManager.client.getTransactions).toHaveBeenCalled()
      expect(transactions[0]).toBeInstanceOf(Transaction)
      expect(transactions[0].data.recipientId).toEqual(sampleTransaction.data.recipientId)
      expect(transactions[0].data.senderPublicKey).toEqual(sampleTransaction.data.senderPublicKey)
    })
  })

  describe('__isDelegateActivated', () => {
    it('should be a function', () => {
      expect(forgeManager.__isDelegateActivated).toBeFunction()
    })

    it('should be ok', async () => {
      forgeManager.delegates = [{
        username: 'arkxdev',
        publicKey: '0310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0'
      }]

      const delegate = await forgeManager.__isDelegateActivated('0310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0')

      expect(delegate).toBeObject()
      expect(delegate.username).toBe('arkxdev')
      expect(delegate.publicKey).toBe('0310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0')
    })
  })

  describe('__analyseNetworkState', () => {
    it('should be a function', () => {
      expect(forgeManager.__analyseNetworkState).toBeFunction()
    })

    it('should be TRUE when quorum > 0.66', async () => {
      const networkState = {
        quorum: 0.9,
        nodeHeight: 100,
        lastBlockId: '1233443',
        overHeightBlockHeader: {},
        minimumNetworkReach: true,
        coldStart: false
      }
      const canForge = await forgeManager.__analyseNetworkState(networkState, delegate)

      expect(canForge).toBeTrue()
    })

    it('should be FALSE when quorum < 0.66', async () => {
      const networkState = {
        quorum: 0.65,
        nodeHeight: 100,
        lastBlockId: '1233443',
        overHeightBlockHeader: {},
        minimumNetworkReach: true,
        coldStart: false
      }
      const canForge = await forgeManager.__analyseNetworkState(networkState, delegate)

      expect(canForge).toBeFalse()
    })

    it('should be FALSE when coldStart is active', async () => {
      const networkState = {
        quorum: 1,
        nodeHeight: 100,
        lastBlockId: '1233443',
        overHeightBlockHeader: {},
        minimumNetworkReach: true,
        coldStart: true
      }
      const canForge = await forgeManager.__analyseNetworkState(networkState, delegate)

      expect(canForge).toBeFalse()
    })

    it('should be FALSE when minimumNetworkReach is not sufficient', async () => {
      const networkState = {
        quorum: 1,
        nodeHeight: 100,
        lastBlockId: '1233443',
        overHeightBlockHeader: {},
        minimumNetworkReach: false,
        coldStart: false
      }
      const canForge = await forgeManager.__analyseNetworkState(networkState, delegate)

      expect(canForge).toBeFalse()
    })

    it('should be FAIL and detect possible double forging', async () => {
      forgeManager.usernames = []
      const overHeightBlockHeader = {
        id: '2816806946235018296',
        height: 2360065,
        generatorPublicKey: '0310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0'
      }

      const networkState = {
        quorum: 1,
        nodeHeight: 100,
        lastBlockId: '1233443',
        overHeightBlockHeader: overHeightBlockHeader,
        minimumNetworkReach: 10,
        coldStart: false
      }
      const canForge = await forgeManager.__analyseNetworkState(networkState, delegate)

      expect(canForge).toBeFalse()
    })
  })
})
