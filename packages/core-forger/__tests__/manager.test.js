'use strict'

const app = require('./__support__/setup')
const defaultConfig = require('../lib/defaults')
const delegate = require('./__fixtures__/delegate')

const { Delegate } = require('@arkecosystem/crypto').models

jest.setTimeout(30000)

let manager

beforeAll(async () => {
  await app.setUp()
})

afterAll(async () => {
  await app.tearDown()
})

beforeEach(() => {
  const ForgeManager = require('../lib/manager')
  defaultConfig.hosts = ['http://127.0.0.1:4000']
  manager = new ForgeManager(defaultConfig)
})

describe('Forger Manager', () => {
  describe('loadDelegates', () => {
    it('should be a function', () => {
      expect(manager.loadDelegates).toBeFunction()
    })

    it('should throw an error without configured delegates', async () => {
      manager.secrets = null
      await expect(manager.loadDelegates()).rejects.toThrowError('No delegate found')
    })

    it('should be ok with configured delegates', async () => {
      const delegates = await manager.loadDelegates()

      expect(delegates).toBeArray()

      delegates.forEach(delegate => expect(delegate).toBeInstanceOf(Delegate))
    })
  })

  describe('startForging', () => {
    it('should be a function', () => {
      expect(manager.startForging).toBeFunction()
    })
  })

  describe('__forgeNewBlock', () => {
    it('should be a function', () => {
      expect(manager.__forgeNewBlock).toBeFunction()
    })
  })

  describe('__monitor', () => {
    it('should be a function', () => {
      expect(manager.__monitor).toBeFunction()
    })
  })

  describe('__getTransactionsForForging', () => {
    it('should be a function', () => {
      expect(manager.__getTransactionsForForging).toBeFunction()
    })
  })

  describe('__isDelegateActivated', () => {
    it('should be a function', () => {
      expect(manager.__isDelegateActivated).toBeFunction()
    })

    it('should be ok', async () => {
      manager.delegates = [{
        username: 'arkxdev',
        publicKey: '0310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0'
      }]

      const delegate = await manager.__isDelegateActivated('0310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0')

      expect(delegate).toBeObject()
      expect(delegate.username).toBe('arkxdev')
      expect(delegate.publicKey).toBe('0310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0')
    })
  })

  describe('__analyseNetworkState', () => {
    it('should be a function', () => {
      expect(manager.__analyseNetworkState).toBeFunction()
    })

    it('should be TRUE when quorum > 0.66', async () => {
      const networkState = {quorum: 0.9, nodeHeight: 100, lastBlockId: '1233443', overHeightBlockHeader: {}, minimumNetworkReach: true, coldStart: false}
      const canForge = await manager.__analyseNetworkState(networkState, delegate)

      expect(canForge).toBeTrue()
    })

    it('should be FALSE when quorum < 0.66', async () => {
      const networkState = {quorum: 0.65, nodeHeight: 100, lastBlockId: '1233443', overHeightBlockHeader: {}, minimumNetworkReach: true, coldStart: false}
      const canForge = await manager.__analyseNetworkState(networkState, delegate)

      expect(canForge).toBeFalse()
    })

    it('should be FALSE when coldStart is active', async () => {
      const networkState = {quorum: 1, nodeHeight: 100, lastBlockId: '1233443', overHeightBlockHeader: {}, minimumNetworkReach: true, coldStart: true}
      const canForge = await manager.__analyseNetworkState(networkState, delegate)

      expect(canForge).toBeFalse()
    })

    it('should be FALSE when minimumNetworkReach is not sufficient', async () => {
      const networkState = {quorum: 1, nodeHeight: 100, lastBlockId: '1233443', overHeightBlockHeader: {}, minimumNetworkReach: false, coldStart: true}
      const canForge = await manager.__analyseNetworkState(networkState, delegate)

      expect(canForge).toBeFalse()
    })

    it('should be FAIL and detect possible double forging', async () => {
      const overHeightBlockHeader = {
        id: '2816806946235018296',
        height: 2360065,
        generatorPublicKey: '0310ad026647eed112d1a46145eed58b8c19c67c505a67f1199361a511ce7860c0'
      }

      const networkState = {quorum: 1, nodeHeight: 100, lastBlockId: '1233443', overHeightBlockHeader: overHeightBlockHeader, minimumNetworkReach: 10, coldStart: true}
      const canForge = await manager.__analyseNetworkState(networkState, delegate)

      expect(canForge).toBeFalse()
    })
  })
})
