'use strict';

const BlockRepository = require('../src/provider')
const repository = new BlockRepository()

describe('Sequelize Provider', () => {
  it('should be an object', async () => {
    await expect(repository).toBeObject()
  })

  describe('init', async () => {
    it('should be a function', async () => {
      await expect(repository.init).toBeFunction()
    })
  })

  describe('runMigrations', async () => {
    it('should be a function', async () => {
      await expect(repository.runMigrations).toBeFunction()
    })
  })

  describe('registerModels', async () => {
    it('should be a function', async () => {
      await expect(repository.registerModels).toBeFunction()
    })
  })

  describe('getActiveDelegates', async () => {
    it('should be a function', async () => {
      await expect(repository.getActiveDelegates).toBeFunction()
    })
  })

  describe('saveRounds', async () => {
    it('should be a function', async () => {
      await expect(repository.saveRounds).toBeFunction()
    })
  })

  describe('deleteRound', async () => {
    it('should be a function', async () => {
      await expect(repository.deleteRound).toBeFunction()
    })
  })

  describe('buildDelegates', async () => {
    it('should be a function', async () => {
      await expect(repository.buildDelegates).toBeFunction()
    })
  })

  describe('buildWallets', async () => {
    it('should be a function', async () => {
      await expect(repository.buildWallets).toBeFunction()
    })
  })

  describe('updateDelegateStats', async () => {
    it('should be a function', async () => {
      await expect(repository.updateDelegateStats).toBeFunction()
    })
  })

  describe('saveWallets', async () => {
    it('should be a function', async () => {
      await expect(repository.saveWallets).toBeFunction()
    })
  })

  describe('saveBlock', async () => {
    it('should be a function', async () => {
      await expect(repository.saveBlock).toBeFunction()
    })
  })

  describe('saveBlockAsync', async () => {
    it('should be a function', async () => {
      await expect(repository.saveBlockAsync).toBeFunction()
    })
  })

  describe('saveBlockCommit', async () => {
    it('should be a function', async () => {
      await expect(repository.saveBlockCommit).toBeFunction()
    })
  })

  describe('deleteBlock', async () => {
    it('should be a function', async () => {
      await expect(repository.deleteBlock).toBeFunction()
    })
  })

  describe('getBlock', async () => {
    it('should be a function', async () => {
      await expect(repository.getBlock).toBeFunction()
    })
  })

  describe('getTransaction', async () => {
    it('should be a function', async () => {
      await expect(repository.getTransaction).toBeFunction()
    })
  })

  describe('getCommonBlock', async () => {
    it('should be a function', async () => {
      await expect(repository.getCommonBlock).toBeFunction()
    })
  })

  describe('getTransactionsFromIds', async () => {
    it('should be a function', async () => {
      await expect(repository.getTransactionsFromIds).toBeFunction()
    })
  })

  describe('getForgedTransactionsIds', async () => {
    it('should be a function', async () => {
      await expect(repository.getForgedTransactionsIds).toBeFunction()
    })
  })

  describe('getLastBlock', async () => {
    it('should be a function', async () => {
      await expect(repository.getLastBlock).toBeFunction()
    })
  })

  describe('getBlocks', async () => {
    it('should be a function', async () => {
      await expect(repository.getBlocks).toBeFunction()
    })
  })

  describe('getBlockHeaders', async () => {
    it('should be a function', async () => {
      await expect(repository.getBlockHeaders).toBeFunction()
    })
  })
})
