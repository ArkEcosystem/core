const Machine = require('xstate').Machine
const arkjs = require('arkjs')
const logger = require('app/core/logger')
const Block = require('app/models/block')
const sleep = require('app/utils/sleep')

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
        NOTSYNCED: 'downloadBlocks',
        PAUSED: 'downloadpaused'
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
    downloadpaused: {
      onEntry: ['downloadPaused'],
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
        TEST: 'idle',
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
      onEntry: ['exitApp']
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
    checkLater: async () => {
      await sleep(60000)

      return blockchainManager.dispatch('WAKEUP')
    },
    checkLastBlockSynced: () => blockchainManager.dispatch(blockchainManager.isSynced(state.lastBlock.data) ? 'SYNCED' : 'NOTSYNCED'),
    checkLastDownloadedBlockSynced: () => {
      let event = 'NOTSYNCED'
      logger.debug(`Blocks in queue: ${blockchainManager.processQueue.length()}`)
      if (blockchainManager.processQueue.length() > 100000) event = 'PAUSED'
      if (blockchainManager.isSynced(state.lastDownloadedBlock.data)) event = 'SYNCED'
      if (blockchainManager.config.server.test) event = 'TEST'
      blockchainManager.dispatch(event)
    },
    downloadFinished: () => logger.info('Blockchain download completed 🚀'),
    downloadPaused: () => logger.info('Blockchain download paused 🕥'),
    syncingFinished: () => {
      logger.info('Blockchain completed, congratulations! 🦄')
      blockchainManager.dispatch('SYNCFINISHED')
    },
    exitApp: () => {
      logger.error('Failed to startup blockchain, exiting app...')
      process.exit(0)
    },
    init: async () => {
      try {
        let block = await blockchainManager.db.getLastBlock()
        if (!block) {
          logger.warn('No block found in database')
          block = new Block(blockchainManager.config.genesisBlock)
          if (block.data.payloadHash !== blockchainManager.config.network.nethash) {
            logger.error('FATAL: The genesis block payload hash is different from configured nethash')
            return blockchainManager.dispatch('FAILURE')
          }
          await blockchainManager.db.saveBlock(block)
        }
        state.lastBlock = block
        state.lastDownloadedBlock = block
        const constants = blockchainManager.config.getConstants(block.data.height)
        state.rebuild = (arkjs.slots.getTime() - block.data.timestamp > (constants.activeDelegates + 1) * constants.blocktime)
        // no fast rebuild if in last round
        state.fastRebuild = (arkjs.slots.getTime() - block.data.timestamp > (constants.activeDelegates + 1) * constants.blocktime) && !!blockchainManager.config.server.fastRebuild
        logger.info(`Fast rebuild: ${state.fastRebuild}`)
        logger.info(`Last block in database: ${block.data.height}`)
        await sleep(5000)
        await blockchainManager.db.buildWallets()
        await sleep(5000)

        await blockchainManager.transactionQueue.send({event: 'start', data: blockchainManager.db.walletManager.getLocalWallets()})
        await blockchainManager.db.saveWallets(true)
        if (block.data.height === 1 || block.data.height % constants.activeDelegates === 0) {
          await blockchainManager.db.applyRound(block, false, false)
        }
        return blockchainManager.dispatch('SUCCESS')
      } catch (error) {
        logger.info(error.message)
        return blockchainManager.dispatch('FAILURE')
      }
    },
    downloadBlocks: async () => {
      const block = state.lastDownloadedBlock || state.lastBlock

      const blocks = await blockchainManager.networkInterface.downloadBlocks(block.data.height)

      if (!blocks || blocks.length === 0) {
        logger.info('No new block found on this peer')

        blockchainManager.dispatch('NOBLOCK')
      } else {
        logger.info(`Downloaded ${blocks.length} new blocks accounting for a total of ${blocks.reduce((sum, b) => sum + b.numberOfTransactions, 0)} transactions`)

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
