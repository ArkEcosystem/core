'use strict'

const app = require('./__support__/setup')

let ConnectionInterface

beforeAll(async (done) => {
  await app.setUp()

  ConnectionInterface = new (require('../lib/interface'))()

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

describe('Connection Interface', () => {
  it('should be an object', () => {
    expect(ConnectionInterface).toBeInstanceOf(require('../lib/interface'))
  })

  describe('getConnection', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.getConnection).toBeFunction()
    })

    it('should return the set connection', () => {
      ConnectionInterface.connection = 'fake-connection'

      expect(ConnectionInterface.getConnection()).toBe('fake-connection')
    })
  })

  describe('connect', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.connect).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.connect()).rejects.toThrowError('Method [connect] not implemented!')
    })
  })

  describe('disconnect', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.disconnect).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.disconnect()).rejects.toThrowError('Method [disconnect] not implemented!')
    })
  })

  describe('getActiveDelegates', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.getActiveDelegates).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.getActiveDelegates()).rejects.toThrowError('Method [getActiveDelegates] not implemented!')
    })
  })

  describe('buildDelegates', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.buildDelegates).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.buildDelegates()).rejects.toThrowError('Method [buildDelegates] not implemented!')
    })
  })

  describe('buildWallets', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.buildWallets).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.buildWallets()).rejects.toThrowError('Method [buildWallets] not implemented!')
    })
  })

  describe('saveWallets', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.saveWallets).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.saveWallets()).rejects.toThrowError('Method [saveWallets] not implemented!')
    })
  })

  describe('saveBlock', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.saveBlock).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.saveBlock()).rejects.toThrowError('Method [saveBlock] not implemented!')
    })
  })

  describe('saveBlockAsync', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.saveBlockAsync).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.saveBlockAsync()).rejects.toThrowError('Method [saveBlockAsync] not implemented!')
    })
  })

  describe('saveBlockCommit', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.saveBlockCommit).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.saveBlockCommit()).rejects.toThrowError('Method [saveBlockCommit] not implemented!')
    })
  })

  describe('deleteBlock', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.deleteBlock).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.deleteBlock()).rejects.toThrowError('Method [deleteBlock] not implemented!')
    })
  })

  describe('getBlock', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.getBlock).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.getBlock()).rejects.toThrowError('Method [getBlock] not implemented!')
    })
  })

  describe('getLastBlock', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.getLastBlock).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.getLastBlock()).rejects.toThrowError('Method [getLastBlock] not implemented!')
    })
  })

  describe('getBlocks', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.getBlocks).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.getBlocks()).rejects.toThrowError('Method [getBlocks] not implemented!')
    })
  })

  describe('getRecentBlockIds', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.getRecentBlockIds).toBeFunction()
    })

    it('should return an array', async () => {
      ConnectionInterface.recentBlockIds = ['10']
      const blockIds = await ConnectionInterface.getRecentBlockIds()

      expect(blockIds).toBeArray()
      expect(blockIds).toIncludeAllMembers(['10'])
    })
  })

  describe('saveRound', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.saveRound).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(() => ConnectionInterface.saveRound()).toThrowError('Method [saveRound] not implemented!')
    })
  })

  describe('deleteRound', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.deleteRound).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(() => ConnectionInterface.deleteRound()).toThrowError('Method [deleteRound] not implemented!')
    })
  })

  describe('updateDelegateStats', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.updateDelegateStats).toBeFunction()
    })
  })

  describe.skip('applyRound', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.applyRound).toBeFunction()
    })
  })

  describe.skip('revertRound', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.revertRound).toBeFunction()
    })
  })

  describe.skip('validateDelegate', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.validateDelegate).toBeFunction()
    })
  })

  describe.skip('validateForkedBlock', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.validateForkedBlock).toBeFunction()
    })
  })

  describe.skip('applyBlock', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.applyBlock).toBeFunction()
    })
  })

  describe.skip('revertBlock', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.revertBlock).toBeFunction()
    })
  })

  describe.skip('verifyTransaction', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.verifyTransaction).toBeFunction()
    })
  })

  describe.skip('applyTransaction', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.applyTransaction).toBeFunction()
    })
  })

  describe.skip('revertTransaction', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.revertTransaction).toBeFunction()
    })
  })

  describe.skip('snapshot', () => {
    it('should be a function', () => {
      expect(ConnectionInterface.snapshot).toBeFunction()
    })
  })

  describe('_registerWalletManager', () => {
    it('should be a function', () => {
      expect(ConnectionInterface._registerWalletManager).toBeFunction()
    })

    it('should register the wallet manager', () => {
      expect(ConnectionInterface).not.toHaveProperty('walletManager')

      ConnectionInterface._registerWalletManager()

      expect(ConnectionInterface).toHaveProperty('walletManager')
    })
  })

  describe('_registerRepositories', () => {
    it('should be a function', () => {
      expect(ConnectionInterface._registerRepositories).toBeFunction()
    })

    it('should register the repositories', async () => {
      await expect(ConnectionInterface).not.toHaveProperty('wallets')
      await expect(ConnectionInterface).not.toHaveProperty('delegates')

      ConnectionInterface._registerRepositories()

      await expect(ConnectionInterface).toHaveProperty('wallets')
      await expect(ConnectionInterface.wallets).toBeInstanceOf(require('../lib/repositories/wallets'))

      await expect(ConnectionInterface).toHaveProperty('delegates')
      await expect(ConnectionInterface.delegates).toBeInstanceOf(require('../lib/repositories/delegates'))
    })
  })
})
