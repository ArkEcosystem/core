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
        DOWNLOADFINISHED: 'downloadBlocks',
        PROCESSFINISHED: 'syncing',
        PROCESSFAILED: 'forked'
      }
    },
    downloadBlocks: {
      onEntry: ['downloadBlocks'],
      on: {
        DOWNLOADED: 'downloadBlocks',
        NOBLOCK: 'syncing',
        PROCESSFINISHED: 'processfinished'
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
        PROCESSFAILED: 'forked'
      }
    },
    processfinished: {
      onEntry: ['checkSynced'],
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

blockchainMachine.actionMap = (blockchainManager) => {
  return {
    blockchainReady: () => (blockchainManager.state.started = true),
    checkLater: () => sleep(60000).then(() => blockchainManager.dispatch('WAKEUP')),
    init: () => {
      blockchainManager.db.getLastBlock()
        .then(block => {
          if (!block) {
            return Promise.reject(new Error('No block found in database'))
          }
          blockchainManager.state.lastBlock = block
          blockchainManager.state.lastDownloadedBlock = block
          const constants = blockchainManager.config.getConstants(block.data.height)
          // no fast rebuild if in last round
          blockchainManager.state.fastSync = (arkjs.slots.getTime() - block.data.timestamp > (constants.activeDelegates + 1) * constants.blocktime) && !!blockchainManager.config.server.fastSync
          goofy.info('Fast Sync:', blockchainManager.state.fastSync)
          goofy.info('Last block in database:', block.data.height)
          if (block.data.height === 1) {
            return blockchainManager.db
              .buildWallets()
              .then(() => blockchainManager.transactionPool.postMessage({event: 'start', data: blockchainManager.db.walletManager.getLocalWallets()}))
              .then(() => blockchainManager.db.saveWallets(true))
              .then(() => blockchainManager.db.applyRound(block, false, false))
              .then(() => blockchainManager.dispatch('SUCCESS'))
          } else {
            return blockchainManager.db
              .buildWallets()
              .then(() => blockchainManager.transactionPool.postMessage({event: 'start', data: blockchainManager.db.walletManager.getLocalWallets()}))
              .then(() => blockchainManager.db.saveWallets(true))
              .then(() => blockchainManager.dispatch('SUCCESS'))
          }
        })
        .catch((error) => {
          goofy.info(error.message)
          let genesis = new Block(blockchainManager.config.genesisBlock)
          if (genesis.data.payloadHash === blockchainManager.config.network.nethash) {
            blockchainManager.state.lastBlock = genesis
            blockchainManager.state.lastDownloadedBlock = genesis
            blockchainManager.state.fastSync = true
            goofy.info('Fast Rebuild:', blockchainManager.state.fastSync)
            return blockchainManager.db.saveBlock(genesis)
              .then(() => blockchainManager.db.buildWallets())
              .then(() => blockchainManager.db.saveWallets(true))
              .then(() => blockchainManager.db.applyRound(genesis))
              .then(() => blockchainManager.dispatch('SUCCESS'))
          }
          return blockchainManager.dispatch('FAILURE')
        })
    },
    checkSynced: () => {
      const block = blockchainManager.state.lastBlock.data
      const isSynced = blockchainManager.isSynced(block)
      blockchainManager.dispatch(isSynced ? 'SYNCED' : 'NOTSYNCED')
    },
    checkLastDownloadedBlockSynced: () => {
      const block = blockchainManager.state.lastDownloadedBlock.data
      const isSynced = blockchainManager.isSynced(block)
      blockchainManager.dispatch(isSynced ? 'SYNCED' : 'NOTSYNCED')
    },
    downloadFinished: () => goofy.info('Blockchain download completed!'),
    syncingFinished: () => {
      goofy.info('Download completed, congratulations! 🦄')
      blockchainManager.dispatch('SYNCFINISHED')
    },
    downloadBlocks: () => {
      const block = blockchainManager.state.lastDownloadedBlock || blockchainManager.state.lastBlock
      return blockchainManager.networkInterface.downloadBlocks(block.data.height).then(blocks => {
        if (!blocks || blocks.length === 0) {
          goofy.info('No new block found on this peer')
          blockchainManager.dispatch('NOBLOCK')
        } else {
          goofy.info(`Downloaded ${blocks.length} new blocks accounting for a total of ${blocks.reduce((sum, b) => sum + b.numberOfTransactions, 0)} transactions`)
          if (blocks.length && blocks[0].previousBlock === block.data.id) {
            blockchainManager.downloadQueue.push(blocks)
          } else {
            blockchainManager.dispatch('FORK')
          }
        }
      })
    }
  }
}

module.exports = blockchainMachine
