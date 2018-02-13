const Machine = require('xstate').Machine
const arkjs = require('arkjs')
const goofy = require('app/core/goofy')
const Block = require('app/models/block')
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// const init = Machine({
//   initial: 'unitisalised',
//   states: {
//     unitisalised: {
//       on: {
//         START: 'mountDatabase'
//       }
//     },
//     mountDatabase: {
//       onEntry: ['mountDatabase'],
//       on: {
//         SUCCESS: 'mountNetwork',
//         FAILURE: 'failed'
//       }
//     },
//     mountNetwork: {
//       onEntry: ['mountNetwork'],
//       on: {
//         SUCCESS: 'initialised',
//         FAILURE: 'failed'
//       }
//     },
//     initialised: {
//     },
//     failed: {
//     }
//   }
// })

const syncWithNetwork = {
  initial: 'syncing',
  states: {
    syncing: {
      onEntry: ['checkLastDownloadedBlockSynced'],
      on: {
        SYNCED: 'downloadfinished',
        NOTSYNCED: 'downloadBlocks'
      }
    },
    idle: {
      on: {
        DOWNLOADED: 'downloadBlocks',
        FORKED: 'forked'
      }
    },
    downloadBlocks: {
      onEntry: ['downloadBlocks'],
      on: {
        DOWNLOADED: 'syncing',
        NOBLOCK: 'syncing'
      }
    },
    processBlocks: {
      onEntry: ['startProcessBlock'],
      on: {
        STARTED: 'idle'
      }
    },
    downloadfinished: {
      onEntry: ['downloadFinished'],
      on: {
        PROCESSFINISHED: 'processfinished',
        FORKED: 'forked'
      }
    },
    processfinished: {
      onEntry: ['checkLastBlockSynced'],
      on: {
        SYNCED: 'end',
        NOTSYNCED: 'downloadBlocks'
      }
    },
    end: {
      onEntry: ['syncingFinished']
    },
    forked: {
      onEntry: ['recoverFromFork']
    }
  }
}

const fork = {
  initial: 'rebuilding',
  states: {
    rebuilding: {
      onEntry: ['rebuild'],
      on: {
        SUCCESS: 'success',
        FAILURE: 'fail'
      }
    },
    fail: {
      onEntry: ['resetNode']
    },
    success: {
      onEntry: ['resetNode']
    }
  }
}

const blockchainMachine = Machine({
  key: 'blockchain',
  initial: 'uninitialised',
  states: {
    uninitialised: {
      on: {
        START: 'init'
      }
    },
    init: {
      onEntry: ['init'],
      on: {
        SUCCESS: 'syncWithNetwork',
        FAILURE: 'exit'
      },
      onExit: ['blockchainReady']
    },
    syncWithNetwork: {
      on: {
        SYNCFINISHED: 'idle',
        FORK: 'fork'
      },
      ...syncWithNetwork
    },
    idle: {
      onEntry: ['checkLater'],
      on: {
        WAKEUP: 'syncWithNetwork',
        NEWBLOCK: 'processingBlock'
      }
    },
    processingBlock: {
      onEntry: ['processBlock'],
      on: {
        SUCCESS: 'idle',
        FAILURE: 'fork'
      }
    },
    fork: {
      on: {
        SUCCESS: 'syncWithNetwork',
        FAILURE: 'exit'
      },
      ...fork
    },
    exit: {
    }
  }
})

const state = {
  blockchain: blockchainMachine.initialState,
  lastDownloadedBlock: null,
  lastBlock: null,
  started: false,
  rebuild: true,
  fastRebuild: true
}

blockchainMachine.state = state

blockchainMachine.actionMap = (blockchainManager) => {
  return {
    blockchainReady: () => (state.started = true),
    checkLater: () => sleep(60000).then(() => blockchainManager.dispatch('WAKEUP')),
    checkLastBlockSynced: () => blockchainManager.dispatch(blockchainManager.isSynced(state.lastBlock.data) ? 'SYNCED' : 'NOTSYNCED'),
    checkLastDownloadedBlockSynced: () => blockchainManager.dispatch(blockchainManager.isSynced(state.lastDownloadedBlock.data) ? 'SYNCED' : 'NOTSYNCED'),
    downloadFinished: () => goofy.info('Blockchain download completed!'),
    syncingFinished: () => {
      goofy.info('Blockchain completed, congratulations! 🦄')
      blockchainManager.dispatch('SYNCFINISHED')
    },
    init: async () => {
      try {
        const block = await blockchainManager.db.getLastBlock()

        if (!block) {
          throw new Error('No block found in database')
        }

        state.lastBlock = block
        state.lastDownloadedBlock = block

        const constants = blockchainManager.config.getConstants(block.data.height)
        state.rebuild = (arkjs.slots.getTime() - block.data.timestamp > (constants.activeDelegates + 1) * constants.blocktime)
        // no fast rebuild if in last round
        state.fastRebuild = (arkjs.slots.getTime() - block.data.timestamp > (constants.activeDelegates + 1) * constants.blocktime) && !!blockchainManager.config.server.fastRebuild

        goofy.info('Fast rebuild:', state.fastRebuild)
        goofy.info('Last block in database:', block.data.height)

        if (block.data.height === 1) {
          await blockchainManager.db.buildWallets()
          await blockchainManager.transactionPool.postMessage({event: 'start', data: blockchainManager.db.walletManager.getLocalWallets()})
          await blockchainManager.db.saveWallets(true)
          await blockchainManager.db.applyRound(block, false, false)
          await blockchainManager.dispatch('SUCCESS')
          return
        } else {
          await blockchainManager.db.buildWallets()
          await blockchainManager.transactionPool.postMessage({event: 'start', data: blockchainManager.db.walletManager.getLocalWallets()})
          await blockchainManager.db.saveWallets(true)
          await blockchainManager.dispatch('SUCCESS')
          return
        }
      } catch (error) {
        goofy.info(error.message)

        let genesis = new Block(blockchainManager.config.genesisBlock)
        if (genesis.data.payloadHash === blockchainManager.config.network.nethash) {
          state.lastBlock = genesis
          state.lastDownloadedBlock = genesis
          state.fastRebuild = state.rebuild = true

          goofy.info('Fast rebuild:', state.fastRebuild)

          await blockchainManager.db.saveBlock(genesis)
          await blockchainManager.db.buildWallets()
          await blockchainManager.db.saveWallets(true)
          await blockchainManager.db.applyRound(genesis)
          await blockchainManager.dispatch('SUCCESS')
          return
        }

        return blockchainManager.dispatch('FAILURE')
      }
    },
    downloadBlocks: async () => {
      const block = state.lastDownloadedBlock || state.lastBlock
      const blocks = await blockchainManager.networkInterface.downloadBlocks(block.data.height)

      if (!blocks || blocks.length === 0) {
        goofy.info('No new block found on this peer')

        blockchainManager.dispatch('NOBLOCK')
      } else {
        goofy.info(`Downloaded ${blocks.length} new blocks accounting for a total of ${blocks.reduce((sum, b) => sum + b.numberOfTransactions, 0)} transactions`)

        if (blocks.length && blocks[0].previousBlock === block.data.id) {
          state.lastDownloadedBlock = {data: blocks.slice(-1)[0]}
          blockchainManager.downloadQueue.push(blocks)
        } else {
          blockchainManager.dispatch('FORK')
        }
      }
    }
  }
}

module.exports = blockchainMachine
