'use strict'

const app = require('./__support__/setup')

let ConnectionInterface
let connectionInterface

beforeAll(async (done) => {
  await app.setUp()

  ConnectionInterface = require('../lib/interface')
  connectionInterface = new ConnectionInterface()

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

describe('Connection Interface', () => {
  it('should be an object', () => {
    expect(connectionInterface).toBeInstanceOf(ConnectionInterface)
  })

  describe('getConnection', () => {
    it('should be a function', () => {
      expect(connectionInterface.getConnection).toBeFunction()
    })

    it('should return the set connection', () => {
      connectionInterface.connection = 'fake-connection'

      expect(connectionInterface.getConnection()).toBe('fake-connection')
    })
  })

  describe('connect', () => {
    it('should be a function', () => {
      expect(connectionInterface.connect).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.connect()).rejects.toThrowError('Method [connect] not implemented!')
    })
  })

  describe('disconnect', () => {
    it('should be a function', () => {
      expect(connectionInterface.disconnect).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.disconnect()).rejects.toThrowError('Method [disconnect] not implemented!')
    })
  })

  describe('getActiveDelegates', () => {
    it('should be a function', () => {
      expect(connectionInterface.getActiveDelegates).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.getActiveDelegates()).rejects.toThrowError('Method [getActiveDelegates] not implemented!')
    })
  })

  describe('buildDelegates', () => {
    it('should be a function', () => {
      expect(connectionInterface.buildDelegates).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.buildDelegates()).rejects.toThrowError('Method [buildDelegates] not implemented!')
    })
  })

  describe('buildWallets', () => {
    it('should be a function', () => {
      expect(connectionInterface.buildWallets).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.buildWallets()).rejects.toThrowError('Method [buildWallets] not implemented!')
    })
  })

  describe('saveWallets', () => {
    it('should be a function', () => {
      expect(connectionInterface.saveWallets).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.saveWallets()).rejects.toThrowError('Method [saveWallets] not implemented!')
    })
  })

  describe('saveBlock', () => {
    it('should be a function', () => {
      expect(connectionInterface.saveBlock).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.saveBlock()).rejects.toThrowError('Method [saveBlock] not implemented!')
    })
  })

  describe('enqueueSaveBlock', () => {
    it('should be a function', () => {
      expect(connectionInterface.enqueueSaveBlock).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.enqueueSaveBlock()).rejects.toThrowError('Method [enqueueSaveBlock] not implemented!')
    })
  })

  describe('commit', () => {
    it('should be a function', () => {
      expect(connectionInterface.commitQueuedQueries).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.commitQueuedQueries()).rejects.toThrowError('Method [commitQueuedQueries] not implemented!')
    })
  })

  describe('deleteBlock', () => {
    it('should be a function', () => {
      expect(connectionInterface.deleteBlock).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.deleteBlock()).rejects.toThrowError('Method [deleteBlock] not implemented!')
    })
  })

  describe('getBlock', () => {
    it('should be a function', () => {
      expect(connectionInterface.getBlock).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.getBlock()).rejects.toThrowError('Method [getBlock] not implemented!')
    })
  })

  describe('getLastBlock', () => {
    it('should be a function', () => {
      expect(connectionInterface.getLastBlock).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.getLastBlock()).rejects.toThrowError('Method [getLastBlock] not implemented!')
    })
  })

  describe('getBlocks', () => {
    it('should be a function', () => {
      expect(connectionInterface.getBlocks).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.getBlocks()).rejects.toThrowError('Method [getBlocks] not implemented!')
    })
  })

  describe('getRecentBlockIds', () => {
    it('should be a function', () => {
      expect(connectionInterface.getRecentBlockIds).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(connectionInterface.getRecentBlockIds()).rejects.toThrowError('Method [getRecentBlockIds] not implemented!')
    })

    xit('should return an array', async () => {
      connectionInterface.recentBlockIds = ['10']
      const blockIds = await connectionInterface.getRecentBlockIds()

      expect(blockIds).toBeArray()
      expect(blockIds).toIncludeAllMembers(['10'])
    })
  })

  describe('saveRound', () => {
    it('should be a function', () => {
      expect(connectionInterface.saveRound).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(() => connectionInterface.saveRound()).toThrowError('Method [saveRound] not implemented!')
    })
  })

  describe('deleteRound', () => {
    it('should be a function', () => {
      expect(connectionInterface.deleteRound).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(() => connectionInterface.deleteRound()).toThrowError('Method [deleteRound] not implemented!')
    })
  })

  describe('updateDelegateStats', () => {
    it('should be a function', () => {
      expect(connectionInterface.updateDelegateStats).toBeFunction()
    })
  })

  describe.skip('applyRound', () => {
    it('should be a function', () => {
      expect(connectionInterface.applyRound).toBeFunction()
    })
  })

  describe.skip('revertRound', () => {
    it('should be a function', () => {
      expect(connectionInterface.revertRound).toBeFunction()
    })
  })

  describe.skip('validateDelegate', () => {
    it('should be a function', () => {
      expect(connectionInterface.validateDelegate).toBeFunction()
    })
  })

  describe.skip('validateForkedBlock', () => {
    it('should be a function', () => {
      expect(connectionInterface.validateForkedBlock).toBeFunction()
    })
  })

  describe.skip('applyBlock', () => {
    it('should be a function', () => {
      expect(connectionInterface.applyBlock).toBeFunction()
    })
  })

  describe.skip('revertBlock', () => {
    it('should be a function', () => {
      expect(connectionInterface.revertBlock).toBeFunction()
    })
  })

  describe.skip('verifyTransaction', () => {
    it('should be a function', () => {
      expect(connectionInterface.verifyTransaction).toBeFunction()
    })
  })

  describe.skip('applyTransaction', () => {
    it('should be a function', () => {
      expect(connectionInterface.applyTransaction).toBeFunction()
    })
  })

  describe.skip('revertTransaction', () => {
    it('should be a function', () => {
      expect(connectionInterface.revertTransaction).toBeFunction()
    })
  })

  describe.skip('snapshot', () => {
    it('should be a function', () => {
      expect(connectionInterface.snapshot).toBeFunction()
    })
  })

  describe('_registerWalletManager', () => {
    it('should be a function', () => {
      expect(connectionInterface._registerWalletManager).toBeFunction()
    })

    it('should register the wallet manager', () => {
      expect(connectionInterface).not.toHaveProperty('walletManager')

      connectionInterface._registerWalletManager()

      expect(connectionInterface).toHaveProperty('walletManager')
    })
  })

  describe('_registerRepositories', () => {
    it('should be a function', () => {
      expect(connectionInterface._registerRepositories).toBeFunction()
    })

    it('should register the repositories', async () => {
      await expect(connectionInterface).not.toHaveProperty('wallets')
      await expect(connectionInterface).not.toHaveProperty('delegates')

      connectionInterface._registerRepositories()

      await expect(connectionInterface).toHaveProperty('wallets')
      await expect(connectionInterface.wallets).toBeInstanceOf(require('../lib/repositories/wallets'))

      await expect(connectionInterface).toHaveProperty('delegates')
      await expect(connectionInterface.delegates).toBeInstanceOf(require('../lib/repositories/delegates'))
    })
  })
})
