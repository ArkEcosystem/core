'use strict'

let connection

beforeAll(async (done) => {
  await require('./__support__/setup')()

  connection = new (require('../lib/connection'))()

  done()
})

describe('Sequelize Connection', () => {
  it('should be an object', async () => {
    await expect(connection).toBeObject()
  })

  describe('connect', async () => {
    it('should be a function', async () => {
      await expect(connection.connect).toBeFunction()
    })
  })

  describe('disconnect', async () => {
    it('should be a function', async () => {
      await expect(connection.disconnect).toBeFunction()
    })
  })

  describe('make', async () => {
    it('should be a function', async () => {
      await expect(connection.make).toBeFunction()
    })
  })

  describe('getActiveDelegates', async () => {
    it('should be a function', async () => {
      await expect(connection.getActiveDelegates).toBeFunction()
    })
  })

  describe('saveRounds', async () => {
    it('should be a function', async () => {
      await expect(connection.saveRounds).toBeFunction()
    })
  })

  describe('deleteRound', async () => {
    it('should be a function', async () => {
      await expect(connection.deleteRound).toBeFunction()
    })
  })

  describe('buildDelegates', async () => {
    it('should be a function', async () => {
      await expect(connection.buildDelegates).toBeFunction()
    })
  })

  describe('buildWallets', async () => {
    it('should be a function', async () => {
      await expect(connection.buildWallets).toBeFunction()
    })
  })

  describe('updateDelegateStats', async () => {
    it('should be a function', async () => {
      await expect(connection.updateDelegateStats).toBeFunction()
    })
  })

  describe('saveWallets', async () => {
    it('should be a function', async () => {
      await expect(connection.saveWallets).toBeFunction()
    })
  })

  describe('saveBlock', async () => {
    it('should be a function', async () => {
      await expect(connection.saveBlock).toBeFunction()
    })
  })

  describe('saveBlockAsync', async () => {
    it('should be a function', async () => {
      await expect(connection.saveBlockAsync).toBeFunction()
    })
  })

  describe('saveBlockCommit', async () => {
    it('should be a function', async () => {
      await expect(connection.saveBlockCommit).toBeFunction()
    })
  })

  describe('deleteBlock', async () => {
    it('should be a function', async () => {
      await expect(connection.deleteBlock).toBeFunction()
    })
  })

  describe('getBlock', async () => {
    it('should be a function', async () => {
      await expect(connection.getBlock).toBeFunction()
    })
  })

  describe('getTransaction', async () => {
    it('should be a function', async () => {
      await expect(connection.getTransaction).toBeFunction()
    })
  })

  describe('getCommonBlock', async () => {
    it('should be a function', async () => {
      await expect(connection.getCommonBlock).toBeFunction()
    })
  })

  describe('getTransactionsFromIds', async () => {
    it('should be a function', async () => {
      await expect(connection.getTransactionsFromIds).toBeFunction()
    })
  })

  describe('getForgedTransactionsIds', async () => {
    it('should be a function', async () => {
      await expect(connection.getForgedTransactionsIds).toBeFunction()
    })
  })

  describe('getLastBlock', async () => {
    it('should be a function', async () => {
      await expect(connection.getLastBlock).toBeFunction()
    })
  })

  describe('getBlocks', async () => {
    it('should be a function', async () => {
      await expect(connection.getBlocks).toBeFunction()
    })
  })

  describe('getBlockHeaders', async () => {
    it('should be a function', async () => {
      await expect(connection.getBlockHeaders).toBeFunction()
    })
  })

  describe('__runMigrations', async () => {
    it('should be a function', async () => {
      await expect(connection.__runMigrations).toBeFunction()
    })
  })

  describe('__registerModels', async () => {
    it('should be a function', async () => {
      await expect(connection.__registerModels).toBeFunction()
    })
  })

  describe('_registerRepositories', async () => {
    it('should be a function', async () => {
      await expect(connection._registerRepositories).toBeFunction()
    })
  })
})
