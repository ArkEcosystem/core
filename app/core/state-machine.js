const Machine = require('xstate').Machine
const arkjs = require('arkjs')
const logger = require('app/core/logger')
const Block = require('app/models/block')
const sleep = require('app/utils/sleep')
const human = require('interval-to-human')
const config = require('app/core/config')

let synctracker = null

const tickSyncTracker = (block) => {
  const constants = config.getConstants(block.data.height)
  if (!synctracker) {
    synctracker = {
      starttimestamp: block.data.timestamp,
      startdate: new Date().getTime()
    }
  }
  const remainingtime = (arkjs.slots.getTime() - block.data.timestamp) * (block.data.timestamp - synctracker.starttimestamp) / (new Date().getTime() - synctracker.startdate) / constants.blocktime
  const title = 'Fast Synchronisation'
  if (block.data.timestamp - arkjs.slots.getTime() < 8) {
    logger.printTracker(title, block.data.timestamp, arkjs.slots.getTime(), human(remainingtime), 3)
  } else {
    synctracker = null
    logger.stopTracker(title, arkjs.slots.getTime(), arkjs.slots.getTime())
  }
}

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
    downloadfinished: {
      onEntry: ['downloadFinished'],
      on: {
        PROCESSFINISHED: 'processfinished',
        FORK: 'forked'
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
    }
  }
}

const rebuildFromNetwork = {
  initial: 'rebuilding',
  states: {
    rebuilding: {
      onEntry: ['checkLastDownloadedBlockSynced'],
      on: {
        SYNCED: 'waitingfinished',
        NOTSYNCED: 'rebuildBlocks',
        PAUSED: 'rebuildpaused'
      }
    },
    idle: {
      on: {
        DOWNLOADED: 'rebuildBlocks',
        FORKED: 'forked'
      }
    },
    rebuildBlocks: {
      onEntry: ['rebuildBlocks'],
      on: {
        DOWNLOADED: 'rebuilding',
        NOBLOCK: 'rebuilding'
      }
    },
    waitingfinished: {
      on: {
        REBUILDFINISHED: 'rebuildfinished',
        FORK: 'forked'
      }
    },
    rebuildfinished: {
      onEntry: ['rebuildFinished'],
      on: {
        FORK: 'forked'
      }
    },
    rebuildpaused: {
      onEntry: ['downloadPaused'],
      on: {
        REBUILDFINISHED: 'processfinished',
        FORK: 'forked'
      }
    },
    processfinished: {
      onEntry: ['checkRebuildBlockSynced'],
      on: {
        SYNCED: 'end',
        NOTSYNCED: 'rebuildBlocks'
      }
    },
    end: {
      onEntry: ['rebuildingFinished']
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
        REBUILD: 'rebuild',
        SYNC: 'syncWithNetwork',
        FAILURE: 'exit'
      }
    },
    rebuild: {
      on: {
        PROCESSFINISHED: 'syncWithNetwork',
        FORK: 'fork'
      },
      ...rebuildFromNetwork
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
      onEntry: ['checkLater', 'blockchainReady'],
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
    checkRebuildBlockSynced: () => blockchainManager.dispatch(blockchainManager.isBuildSynced(state.lastBlock.data) ? 'SYNCED' : 'NOTSYNCED'),
    checkLastDownloadedBlockSynced: () => {
      let event = 'NOTSYNCED'
      logger.debug(`Blocks in queue: ${blockchainManager.rebuildQueue.length()}`)
      if (blockchainManager.rebuildQueue.length() > 100000) event = 'PAUSED'
      if (blockchainManager.isSynced(state.lastDownloadedBlock.data)) event = 'SYNCED'
      if (blockchainManager.config.server.test) event = 'TEST'
      blockchainManager.dispatch(event)
    },
    downloadFinished: () => logger.info('Blockchain download completed 🚀'),
    rebuildFinished: async () => {
      try {
        state.rebuild = false
        await blockchainManager.db.saveBlockCommit()
        await blockchainManager.db.buildWallets()
        // blockchainManager.transactionPool.initialiseWallets(blockchainManager.db.walletManager.getLocalWallets())
        await blockchainManager.db.saveWallets(true)
        await blockchainManager.db.applyRound(state.lastBlock)
        return blockchainManager.dispatch('PROCESSFINISHED')
      } catch (error) {
        logger.info(error.message)
        return blockchainManager.dispatch('FAILURE')
      }
    },
    downloadPaused: () => logger.info('Blockchain download paused 🕥'),
    syncingFinished: () => {
      logger.info('Blockchain completed, congratulations! 🦄')
      blockchainManager.dispatch('SYNCFINISHED')
    },
    rebuildingFinished: () => {
      logger.info('Blockchain completed, congratulations! 🦄')
      blockchainManager.dispatch('REBUILDFINISHED')
    },
    exitApp: () => {
      logger.error('Failed to startup blockchain, exiting app...')
      process.exit(1)
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
        state.fastRebuild = (arkjs.slots.getTime() - block.data.timestamp > 10 * (constants.activeDelegates + 1) * constants.blocktime) && !!blockchainManager.config.server.fastRebuild
        logger.info(`Fast rebuild: ${state.fastRebuild}`)
        logger.info(`Last block in database: ${block.data.height}`)
        if (state.fastRebuild) return blockchainManager.dispatch('REBUILD')
        await blockchainManager.db.buildWallets()
        // blockchainManager.transactionPool.initialiseWallets(blockchainManager.db.walletManager.getLocalWallets())
        await blockchainManager.db.saveWallets(true)
        if (block.data.height === 1 || block.data.height % constants.activeDelegates === 0) {
          await blockchainManager.db.applyRound(block, false, false)
        }
        return blockchainManager.dispatch('SYNC')
      } catch (error) {
        logger.info(error.message)
        return blockchainManager.dispatch('FAILURE')
      }
    },
    rebuildBlocks: async () => {
      const block = state.lastDownloadedBlock || state.lastBlock
      logger.info(`Downloading blocks from block ${block.data.height}`)
      tickSyncTracker(block)
      const blocks = await blockchainManager.networkInterface.downloadBlocks(block.data.height)

      if (!blocks || blocks.length === 0) {
        logger.info('No new block found on this peer')

        blockchainManager.dispatch('NOBLOCK')
      } else {
        logger.info(`Downloaded ${blocks.length} new blocks accounting for a total of ${blocks.reduce((sum, b) => sum + b.numberOfTransactions, 0)} transactions`)

        if (blocks.length && blocks[0].previousBlock === block.data.id) {
          state.lastDownloadedBlock = {data: blocks.slice(-1)[0]}
          blockchainManager.rebuildQueue.push(blocks)
          blockchainManager.dispatch('DOWNLOADED')
        } else {
          blockchainManager.dispatch('FORK')
        }
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
          blockchainManager.processQueue.push(blocks)
          blockchainManager.dispatch('DOWNLOADED')
        } else {
          blockchainManager.dispatch('FORK')
        }
      }
    }
  }
}

module.exports = blockchainMachine
