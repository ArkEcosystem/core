'use strict';

const logger = require('@arkecosystem/core-plugin-manager').get('logger')

const client = require('@arkecosystem/client')
const { slots } = client
const { Block } = client.models

const sleep = require('./utils/sleep')
const tickSyncTracker = require('./utils/tick-sync-tracker')
const blockchainMachine = require('./machines/blockchain')

/**
 * Initial state of the machine.
 * @type {Object}
 */
const state = {
  blockchain: blockchainMachine.initialState,
  lastDownloadedBlock: null,
  lastBlock: null,
  started: false,
  rebuild: true,
  fastRebuild: true
}

/**
 * @type {Object}
 */
blockchainMachine.state = state

/**
 * The blockchain actions.
 * @param  {BlockchainManager} blockchainManager
 * @return {Object}
 */
blockchainMachine.actionMap = (blockchainManager) => {
  return {
    blockchainReady: () => (state.started = true),
    checkLater: async () => {
      await sleep(60000)
      return blockchainManager.dispatch('WAKEUP')
    },
    checkLastBlockSynced: () => blockchainManager.dispatch(blockchainManager.isSynced(state.lastBlock.data) ? 'SYNCED' : 'NOTSYNCED'),
    checkRebuildBlockSynced: () => blockchainManager.dispatch(blockchainManager.isRebuildSynced(state.lastBlock.data) ? 'SYNCED' : 'NOTSYNCED'),
    checkLastDownloadedBlockSynced: () => {
      let event = 'NOTSYNCED'
      logger.debug(`Blocks in queue: ${blockchainManager.rebuildQueue.length()}`)

      if (blockchainManager.rebuildQueue.length() > 100000) {
        event = 'PAUSED'
      }

      if (blockchainManager.isSynced(state.lastDownloadedBlock.data)) {
        event = 'SYNCED'
      }

      if (state.networkStart) {
        event = 'SYNCED'
      }

      if (process.env.ARK_ENV === 'testnet') {
        event = 'TEST'
      }

      blockchainManager.dispatch(event)
    },
    downloadFinished: () => {
      logger.info('Blockchain download completed 🚀')
      if (state.networkStart) {
        // next time we will use normal behaviour
        state.networkStart = false
        blockchainManager.dispatch('SYNCFINISHED')
      }
    },
    rebuildFinished: async () => {
      try {
        logger.info('Blockchain rebuild complete! ⛓')
        state.rebuild = false
        await blockchainManager.getDatabaseConnection().saveBlockCommit()
        await blockchainManager.deleteBlocksToLastRound()
        await blockchainManager.getDatabaseConnection().buildWallets(state.lastBlock.data.height)
        await blockchainManager.getDatabaseConnection().saveWallets(true)
        // blockchainManager.transactionPool.initialiseWallets(blockchainManager.getDatabaseConnection().walletManager.getLocalWallets())
        // await blockchainManager.getDatabaseConnection().applyRound(state.lastBlock.data.height)
        return blockchainManager.dispatch('PROCESSFINISHED')
      } catch (error) {
        logger.error(error.stack)
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
        let block = await blockchainManager.getDatabaseConnection().getLastBlock()
        if (!block) {
          logger.warn('No block found in database')
          block = new Block(blockchainManager.config.genesisBlock)
          if (block.data.payloadHash !== blockchainManager.config.network.nethash) {
            logger.error('FATAL: The genesis block payload hash is different from configured nethash')
            return blockchainManager.dispatch('FAILURE')
          }
          await blockchainManager.getDatabaseConnection().saveBlock(block)
        }
        // only genesis block? special case of first round needs to be dealt with
        if (block.data.height === 1) await blockchainManager.getDatabaseConnection().deleteRound(1)

        /*********************************
         *  state machine data init      *
         ********************************/
        const constants = blockchainManager.config.getConstants(block.data.height)
        state.lastBlock = block
        state.lastDownloadedBlock = block
        state.rebuild = (slots.getTime() - block.data.timestamp > (constants.activeDelegates + 1) * constants.blocktime)
        // no fast rebuild if in 10 last round
        state.fastRebuild = (slots.getTime() - block.data.timestamp > 10 * (constants.activeDelegates + 1) * constants.blocktime) && !!blockchainManager.config.server.fastRebuild

        // NODE_ENV=test >>> Jest Test-Suite
        if (process.env.NODE_ENV === 'test') {
          return blockchainManager.dispatch('STARTED')
        }

        logger.info(`Fast rebuild: ${state.fastRebuild}`)
        logger.info(`Last block in database: ${block.data.height}`)

        if (state.fastRebuild) {
          return blockchainManager.dispatch('REBUILD')
        }

        // removing blocks up to the last round to compute active delegate list later if needed
        if (!blockchainManager.getDatabaseConnection().getActiveDelegates(block.data.height)) {
          await blockchainManager.deleteBlocksToLastRound()
        }

        /*********************************
         * database init                 *
         ********************************/
        // SPV rebuild
        await blockchainManager.getDatabaseConnection().buildWallets(block.data.height)
        await blockchainManager.getDatabaseConnection().saveWallets(true)
        await blockchainManager.getDatabaseConnection().applyRound(block.data.height)
        return blockchainManager.dispatch('STARTED')
      } catch (error) {
        logger.error(error.stack)
        return blockchainManager.dispatch('FAILURE')
      }
    },
    rebuildBlocks: async () => {
      const block = state.lastDownloadedBlock || state.lastBlock
      logger.info(`Downloading blocks from block ${block.data.height}`)
      tickSyncTracker(block)
      const blocks = await blockchainManager.getNetworkInterface().downloadBlocks(block.data.height)

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
          logger.warn('Block Downloaded not accepted')
          console.log(blocks[0])
          blockchainManager.dispatch('FORK')
        }
      }
    },
    downloadBlocks: async () => {
      const block = state.lastDownloadedBlock || state.lastBlock

      const blocks = await blockchainManager.getNetworkInterface().downloadBlocks(block.data.height)

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
          logger.warn('Block Downloaded not accepted')
          console.log(blocks[0])
          blockchainManager.dispatch('FORK')
        }
      }
    },
    startForkRecovery: async () => {
      logger.info('Starting Fork Recovery 🍴')
      logger.info('Let sail the Ark in stormy waters ⛵️')
      // state.forked = true
      const random = ~~(4 / Math.random())
      await blockchainManager.removeBlocks(random)
      logger.info('Nice ride on the last ' + random + ' blocks 🌊')
      blockchainManager.dispatch('SUCCESS')
    }
  }
}

module.exports = blockchainMachine
