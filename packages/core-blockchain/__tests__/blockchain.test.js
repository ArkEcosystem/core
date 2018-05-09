'use strict'

const app = require('./__support__/setup')

let blockchain

beforeAll(async (done) => {
  await app.setUp()

  blockchain = new (require('../lib/blockchain'))()

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

describe('Blockchain', () => {
  it('should be a function', () => {
    expect(blockchain).toBeObject()
  })

  describe('dispatch', () => {
    it('should be a function', () => {
      expect(blockchain.dispatch).toBeFunction()
    })
  })

  describe('start', () => {
    it('should be a function', () => {
      expect(blockchain.start).toBeFunction()
    })
  })

  describe('checkNetwork', () => {
    it('should be a function', () => {
      expect(blockchain.checkNetwork).toBeFunction()
    })
  })

  describe('updateNetworkStatus', () => {
    it('should be a function', () => {
      expect(blockchain.updateNetworkStatus).toBeFunction()
    })
  })

  describe('rebuild', () => {
    it('should be a function', () => {
      expect(blockchain.rebuild).toBeFunction()
    })
  })

  describe('resetState', () => {
    it('should be a function', () => {
      expect(blockchain.resetState).toBeFunction()
    })
  })

  describe('postTransactions', () => {
    it('should be a function', () => {
      expect(blockchain.postTransactions).toBeFunction()
    })
  })

  describe('queueBlock', () => {
    it('should be a function', () => {
      expect(blockchain.queueBlock).toBeFunction()
    })
  })

  describe('rollbackCurrentRound', () => {
    it('should be a function', () => {
      expect(blockchain.rollbackCurrentRound).toBeFunction()
    })
  })

  describe('removeBlocks', () => {
    it('should be a function', () => {
      expect(blockchain.removeBlocks).toBeFunction()
    })
  })

  describe('rebuildBlock', () => {
    it('should be a function', () => {
      expect(blockchain.rebuildBlock).toBeFunction()
    })
  })

  describe('processBlock', () => {
    it('should be a function', () => {
      expect(blockchain.processBlock).toBeFunction()
    })
  })

  describe('acceptChainedBlock', () => {
    it('should be a function', () => {
      expect(blockchain.acceptChainedBlock).toBeFunction()
    })
  })

  describe('manageUnchainedBlock', () => {
    it('should be a function', () => {
      expect(blockchain.manageUnchainedBlock).toBeFunction()
    })
  })

  describe('getUnconfirmedTransactions', () => {
    it('should be a function', () => {
      expect(blockchain.getUnconfirmedTransactions).toBeFunction()
    })
  })

  describe('isSynced', () => {
    it('should be a function', () => {
      expect(blockchain.isSynced).toBeFunction()
    })
  })

  describe('isRebuildSynced', () => {
    it('should be a function', () => {
      expect(blockchain.isRebuildSynced).toBeFunction()
    })
  })

  describe('getLastBlock', () => {
    it('should be a function', () => {
      expect(blockchain.getLastBlock).toBeFunction()
    })
  })

  describe('get state', () => {
    it('should be an object', () => {
      expect(blockchain.state).toEqual({
        blockchain: {
          actions: [],
          activities: {},
          data: {},
          events: [],
          history: undefined,
          value: 'uninitialised'
        },
        fastRebuild: true,
        lastBlock: null,
        lastDownloadedBlock: null,
        networkStart: false,
        rebuild: true,
        started: false
      })
    })
  })

  describe('stateMachine', () => {
    it('should be a function', () => {
      expect(blockchain.stateMachine).toBeObject()
    })
  })

  describe.skip('p2p', () => {
    it('should be a function', () => {
      expect(blockchain.p2p).toBeFunction()
    })
  })

  describe.skip('transactionPool', () => {
    it('should be a function', () => {
      expect(blockchain.transactionPool).toBeFunction()
    })
  })

  describe.skip('database', () => {
    it('should be a function', () => {
      expect(blockchain.database).toBeFunction()
    })
  })

  describe('__isChained', () => {
    it('should be a function', () => {
      expect(blockchain.__isChained).toBeFunction()
    })
  })

  describe('__registerQueue', () => {
    it('should be a function', () => {
      expect(blockchain.__registerQueue).toBeFunction()
    })
  })
})
