'use strict'

const app = require('./__support__/setup')

let ConnectionInterface

beforeAll(async (done) => {
  await app.setUp()

  ConnectionInterface = new (require('../lib/interface'))()

  done()
})

// afterAll(async (done) => {
//   await app.tearDown()

//   done()
// })

describe('Connection Interface', () => {
  it('should be an object', async () => {
    await expect(ConnectionInterface).toBeInstanceOf(require('../lib/interface'))
  })

  describe('getConnection', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.getConnection).toBeFunction()
    })
  })

  describe('connect', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.connect).toBeFunction()
    })
  })

  describe('disconnect', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.disconnect).toBeFunction()
    })
  })

  describe('getActiveDelegates', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.getActiveDelegates).toBeFunction()
    })
  })

  describe('buildDelegates', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.buildDelegates).toBeFunction()
    })
  })

  describe('buildWallets', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.buildWallets).toBeFunction()
    })
  })

  describe('saveWallets', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.saveWallets).toBeFunction()
    })
  })

  describe('saveBlock', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.saveBlock).toBeFunction()
    })
  })

  describe('saveBlockAsync', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.saveBlockAsync).toBeFunction()
    })
  })

  describe('saveBlockCommit', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.saveBlockCommit).toBeFunction()
    })
  })

  describe('deleteBlock', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.deleteBlock).toBeFunction()
    })
  })

  describe('getBlock', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.getBlock).toBeFunction()
    })
  })

  describe('getLastBlock', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.getLastBlock).toBeFunction()
    })
  })

  describe('getBlocks', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.getBlocks).toBeFunction()
    })
  })

  describe('saveRound', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.saveRound).toBeFunction()
    })
  })

  describe('deleteRound', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.deleteRound).toBeFunction()
    })
  })

  describe('updateDelegateStats', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.updateDelegateStats).toBeFunction()
    })
  })

  describe('applyRound', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.applyRound).toBeFunction()
    })
  })

  describe('undoRound', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.undoRound).toBeFunction()
    })
  })

  describe('validateDelegate', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.validateDelegate).toBeFunction()
    })
  })

  describe('validateForkedBlock', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.validateForkedBlock).toBeFunction()
    })
  })

  describe('applyBlock', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.applyBlock).toBeFunction()
    })
  })

  describe('undoBlock', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.undoBlock).toBeFunction()
    })
  })

  describe('applyTransaction', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.applyTransaction).toBeFunction()
    })
  })

  describe('undoTransaction', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.undoTransaction).toBeFunction()
    })
  })

  describe('snapshot', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface.snapshot).toBeFunction()
    })
  })

  describe('_registerWalletManager', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface._registerWalletManager).toBeFunction()
    })
  })

  describe('_registerRepositories', async () => {
    it('should be a function', async () => {
      await expect(ConnectionInterface._registerRepositories).toBeFunction()
    })
  })
})
