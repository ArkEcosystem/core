'use strict'

const logger = require('@arkecosystem/core-container').resolvePlugin('logger')

const { slots } = require('@arkecosystem/crypto')
const { Block } = require('@arkecosystem/crypto').models

const delay = require('delay')
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
 * @param  {Blockchain} blockchain
 * @return {Object}
 */
blockchainMachine.actionMap = blockchain => {
  return {
    blockchainReady: () => (state.started = true),

    async checkLater () {
      await delay(60000)
      return blockchain.dispatch('WAKEUP')
    },

    checkLastBlockSynced () {
      return blockchain.dispatch(blockchain.isSynced() ? 'SYNCED' : 'NOTSYNCED')
    },

    checkRebuildBlockSynced () {
      return blockchain.dispatch(blockchain.isRebuildSynced() ? 'SYNCED' : 'NOTSYNCED')
    },

    checkLastDownloadedBlockSynced () {
      let event = 'NOTSYNCED'
      logger.debug(`Blocks in queue: ${blockchain.rebuildQueue.length()}`)

      if (blockchain.rebuildQueue.length() > 10000) {
        event = 'PAUSED'
      }

      if (blockchain.isSynced(state.lastDownloadedBlock.data)) {
        event = 'SYNCED'
      }

      if (state.networkStart) {
        event = 'SYNCED'
      }

      if (process.env.ARK_ENV === 'test') {
        event = 'TEST'
      }

      blockchain.dispatch(event)
    },

    downloadFinished () {
      logger.info('Blockchain download finished :rocket:')

      if (state.networkStart) {
        // next time we will use normal behaviour
        state.networkStart = false
        blockchain.dispatch('SYNCFINISHED')
      }
    },

    async rebuildFinished () {
      try {
        logger.info('Blockchain rebuild finished :chains:')
        state.rebuild = false
        await blockchain.database.saveBlockCommit()
        await blockchain.rollbackCurrentRound()
        await blockchain.database.buildWallets(state.lastBlock.data.height)
        await blockchain.database.saveWallets(true)
        await blockchain.transactionPool.buildWallets()

        // await blockchain.database.applyRound(blockchain.getLastBlock(true).height)
        return blockchain.dispatch('PROCESSFINISHED')
      } catch (error) {
        logger.error(error.stack)
        return blockchain.dispatch('FAILURE')
      }
    },

    downloadPaused: () => logger.info('Blockchain download paused :clock1030:'),

    syncingComplete () {
      logger.info('Blockchain download complete :unicorn_face:')
      blockchain.dispatch('SYNCFINISHED')
    },

    rebuildingComplete () {
      logger.info('Blockchain rebuild complete :unicorn_face:')
      blockchain.dispatch('REBUILDFINISHED')
    },

    exitApp () {
      logger.error('Failed to startup blockchain, exiting...')
      process.exit(1)
    },

    async init () {
      try {
        let block = await blockchain.database.getLastBlock()

        if (!block) {
          logger.warn('No block found in database')
          block = new Block(blockchain.config.genesisBlock)

          if (block.data.payloadHash !== blockchain.config.network.nethash) {
            logger.error('FATAL: The genesis block payload hash is different from configured nethash')
            return blockchain.dispatch('FAILURE')
          }

          await blockchain.database.saveBlock(block)
        }

        // only genesis block? special case of first round needs to be dealt with
        if (block.data.height === 1) {
          await blockchain.database.deleteRound(1)
        }

        /*********************************
         *  state machine data init      *
         ********************************/
        const constants = blockchain.config.getConstants(block.data.height)
        state.lastBlock = block
        state.lastDownloadedBlock = block
        state.rebuild = (slots.getTime() - block.data.timestamp > (constants.activeDelegates + 1) * constants.blocktime)
        // no fast rebuild if in 10 last round
        state.fastRebuild = (slots.getTime() - block.data.timestamp > 10 * (constants.activeDelegates + 1) * constants.blocktime) && !!blockchain.config.server.fastRebuild

        if (process.env.NODE_ENV === 'test') {
          logger.verbose('JEST TEST SUITE DETECTED! SYNCING WALLETS AND STARTING IMMEDIATELY.')

          state.lastBlock = new Block(blockchain.config.genesisBlock)
          await blockchain.database.buildWallets(block.data.height)

          return blockchain.dispatch('STARTED')
        }

        logger.info(`Fast rebuild: ${state.fastRebuild}`)
        logger.info(`Last block in database: ${block.data.height}`)

        if (state.fastRebuild) {
          return blockchain.dispatch('REBUILD')
        }
        // removing blocks up to the last round to compute active delegate list later if needed
        const activeDelegates = await blockchain.database.getActiveDelegates(block.data.height)
        if (!activeDelegates) {
          await blockchain.rollbackCurrentRound()
        }

        /*********************************
         * database init                 *
         ********************************/
        // SPV rebuild
        await blockchain.database.buildWallets(block.data.height)
        await blockchain.database.saveWallets(true)
        await blockchain.database.applyRound(block.data.height)
        await blockchain.transactionPool.buildWallets()

        return blockchain.dispatch('STARTED')
      } catch (error) {
        logger.error(error.stack)
        return blockchain.dispatch('FAILURE')
      }
    },

    async rebuildBlocks () {
      const block = state.lastDownloadedBlock || state.lastBlock
      logger.info(`Downloading blocks from block ${block.data.height}`)
      tickSyncTracker(block)
      const blocks = await blockchain.p2p.downloadBlocks(block.data.height)

      if (!blocks || blocks.length === 0) {
        logger.info('No new block found on this peer')
        blockchain.dispatch('NOBLOCK')
      } else {
        logger.info(`Downloaded ${blocks.length} new blocks accounting for a total of ${blocks.reduce((sum, b) => sum + b.numberOfTransactions, 0)} transactions`)

        if (blocks.length && blocks[0].previousBlock === block.data.id) {
          state.lastDownloadedBlock = {data: blocks.slice(-1)[0]}
          blockchain.rebuildQueue.push(blocks)
          blockchain.dispatch('DOWNLOADED')
        } else {
          logger.warn('Downloaded block not accepted', blocks[0])
          blockchain.dispatch('FORK')
        }
      }
    },

    async downloadBlocks () {
      const block = state.lastDownloadedBlock || state.lastBlock

      const blocks = await blockchain.p2p.downloadBlocks(block.data.height)

      if (!blocks || blocks.length === 0) {
        logger.info('No new block found on this peer')
        blockchain.dispatch('NOBLOCK')
      } else {
        logger.info(`Downloaded ${blocks.length} new blocks accounting for a total of ${blocks.reduce((sum, b) => sum + b.numberOfTransactions, 0)} transactions`)

        if (blocks.length && blocks[0].previousBlock === block.data.id) {
          state.lastDownloadedBlock = {data: blocks.slice(-1)[0]}
          blockchain.processQueue.push(blocks)
          blockchain.dispatch('DOWNLOADED')
        } else {
          logger.warn('Downloaded block not accepted', blocks[0])
          blockchain.dispatch('FORK')
        }
      }
    },

    async analyseFork () {
      logger.info('Analysing fork')
    },

    async startForkRecovery () {
      logger.info('Starting fork recovery 🍴')
      // state.forked = true
      const random = ~~(4 / Math.random())
      await blockchain.removeBlocks(random)
      logger.info(`Removed ${random} blocks`)
      blockchain.dispatch('SUCCESS')
    }
  }
}

module.exports = blockchainMachine
