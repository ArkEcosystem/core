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
  it('should be an object', async () => {
    await expect(ConnectionInterface).toBeInstanceOf(require('../lib/interface'))
  })

  describe('getConnection', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.getConnection).toBeFunction()
    })

    it('should return the set connection', async () => {
      ConnectionInterface.connection = 'fake-connection'

      await expect(ConnectionInterface.getConnection()).toBe('fake-connection')
    })
  })

  describe('connect', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.connect).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.connect()).rejects.toThrowError('Method [connect] not implemented!')
    })
  })

  describe('disconnect', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.disconnect).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.disconnect()).rejects.toThrowError('Method [disconnect] not implemented!')
    })
  })

  describe('getActiveDelegates', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.getActiveDelegates).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.getActiveDelegates()).rejects.toThrowError('Method [getActiveDelegates] not implemented!')
    })
  })

  describe('buildDelegates', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.buildDelegates).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.buildDelegates()).rejects.toThrowError('Method [buildDelegates] not implemented!')
    })
  })

  describe('buildWallets', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.buildWallets).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.buildWallets()).rejects.toThrowError('Method [buildWallets] not implemented!')
    })
  })

  describe('saveWallets', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.saveWallets).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.saveWallets()).rejects.toThrowError('Method [saveWallets] not implemented!')
    })
  })

  describe('saveBlock', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.saveBlock).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.saveBlock()).rejects.toThrowError('Method [saveBlock] not implemented!')
    })
  })

  describe('saveBlockAsync', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.saveBlockAsync).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.saveBlockAsync()).rejects.toThrowError('Method [saveBlockAsync] not implemented!')
    })
  })

  describe('saveBlockCommit', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.saveBlockCommit).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.saveBlockCommit()).rejects.toThrowError('Method [saveBlockCommit] not implemented!')
    })
  })

  describe('deleteBlock', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.deleteBlock).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.deleteBlock()).rejects.toThrowError('Method [deleteBlock] not implemented!')
    })
  })

  describe('getBlock', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.getBlock).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.getBlock()).rejects.toThrowError('Method [getBlock] not implemented!')
    })
  })

  describe('getLastBlock', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.getLastBlock).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.getLastBlock()).rejects.toThrowError('Method [getLastBlock] not implemented!')
    })
  })

  describe('getBlocks', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.getBlocks).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.getBlocks()).rejects.toThrowError('Method [getBlocks] not implemented!')
    })
  })

  describe('saveRound', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.saveRound).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(() => ConnectionInterface.saveRound()).toThrowError('Method [saveRound] not implemented!')
    })
  })

  describe('deleteRound', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.deleteRound).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(() => ConnectionInterface.deleteRound()).toThrowError('Method [deleteRound] not implemented!')
    })
  })

  describe('updateDelegateStats', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.updateDelegateStats).toBeFunction()
    })

    it('should throw an exception', async () => {
      await expect(ConnectionInterface.updateDelegateStats()).rejects.toThrowError('Method [updateDelegateStats] not implemented!')
    })
  })

  describe.skip('applyRound', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.applyRound).toBeFunction()
    })
  })

  describe.skip('undoRound', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.undoRound).toBeFunction()
    })
  })

  describe.skip('validateDelegate', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.validateDelegate).toBeFunction()
    })
  })

  describe.skip('validateForkedBlock', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.validateForkedBlock).toBeFunction()
    })
  })

  describe.skip('applyBlock', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.applyBlock).toBeFunction()
    })
  })

  describe.skip('undoBlock', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.undoBlock).toBeFunction()
    })
  })

  describe.skip('verifyTransaction', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.verifyTransaction).toBeFunction()
    })
  })

  describe.skip('applyTransaction', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.applyTransaction).toBeFunction()
    })
  })

  describe.skip('undoTransaction', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.undoTransaction).toBeFunction()
    })
  })

  describe.skip('snapshot', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.snapshot).toBeFunction()
    })
  })

  describe('_registerWalletManager', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface._registerWalletManager).toBeFunction()
    })

    it('should register the wallet manager', async () => {
      await expect(ConnectionInterface).not.toHaveProperty('walletManager')

      ConnectionInterface._registerWalletManager()

      await expect(ConnectionInterface).toHaveProperty('walletManager')
    })
  })

  describe('_registerRepositories', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface._registerRepositories).toBeFunction()
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
