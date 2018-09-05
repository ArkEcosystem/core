'use strict'

const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const emitter = container.resolvePlugin('event-emitter')
const logger = container.resolvePlugin('logger')

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
  blockPing: null,
  started: false,
  rebuild: true,
  fastRebuild: false,
  noBlockCounter: 0
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
    blockchainReady: () => {
      if (!state.started) {
        state.started = true
        emitter.emit('state:started', true)
      }
    },

    async checkLater () {
      if (!blockchain.isStopped) {
        await delay(60000)
        return blockchain.dispatch('WAKEUP')
      }
    },

    checkLastBlockSynced () {
      return blockchain.dispatch(blockchain.isSynced() ? 'SYNCED' : 'NOTSYNCED')
    },

    checkRebuildBlockSynced () {
      return blockchain.dispatch(blockchain.isRebuildSynced() ? 'SYNCED' : 'NOTSYNCED')
    },

    checkLastDownloadedBlockSynced () {
      let event = 'NOTSYNCED'
      logger.debug(`Queued blocks for rebuildQueue: ${blockchain.rebuildQueue.length()}`)
      logger.debug(`Queued blocks for processQueue: ${blockchain.processQueue.length()}`)

      if (blockchain.rebuildQueue.length() > 10000 || blockchain.processQueue.length() > 10000) {
        event = 'PAUSED'
      }

      // tried to download but no luck after 5 tries (looks like network missing blocks)
      if (state.noBlockCounter > 5) {
        logger.info('Tried to sync 5 times to different nodes, looks like the network is missing blocks :umbrella:')

        state.noBlockCounter = 0

        event = 'NETWORKHALTED'
      }

      if (blockchain.isSynced(state.lastDownloadedBlock)) {
        state.noBlockCounter = 0
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
      logger.info('Block download finished :rocket:')

     if (state.networkStart) {
        // next time we will use normal behaviour
        state.networkStart = false

        blockchain.dispatch('SYNCFINISHED')
      } else if (blockchain.rebuildQueue.length() === 0) {
          blockchain.dispatch('PROCESSFINISHED')
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
        // await blockchain.database.applyRound(blockchain.getLastBlock().data.height)

        return blockchain.dispatch('PROCESSFINISHED')
      } catch (error) {
        logger.error(error.stack)
        return blockchain.dispatch('FAILURE')
      }
    },

    downloadPaused: () => logger.info('Blockchain download paused :clock1030:'),

    syncingComplete () {
      logger.info('Blockchain 100% in sync :100:')
      blockchain.dispatch('SYNCFINISHED')
    },

    rebuildingComplete () {
      logger.info('Blockchain rebuild complete :unicorn_face:')
      blockchain.dispatch('REBUILDCOMPLETE')
    },

    stopped () {
      logger.info('The blockchain has been stopped :guitar:')
    },

    exitApp () {
      logger.error('Failed to startup blockchain. Exiting ARK Core! :rotating_light:')
      process.exit(1)
    },

    async init () {
      try {
        let block = await blockchain.database.getLastBlock()

        if (!block) {
          logger.warn('No block found in database :hushed:')

          block = new Block(config.genesisBlock)

          if (block.data.payloadHash !== config.network.nethash) {
            logger.error('FATAL: The genesis block payload hash is different from configured the nethash :rotating_light:')

            return blockchain.dispatch('FAILURE')
          }

          await blockchain.database.saveBlock(block)
        }

        logger.info('Verifying database integrity :hourglass_flowing_sand:')

        const databaseBlokchain = await blockchain.database.verifyBlockchain()

        if (!databaseBlokchain.valid) {
          logger.error('FATAL: The database is corrupted :rotating_light:')

          console.error(databaseBlokchain.errors)

          return blockchain.dispatch('FAILURE')
        }

        logger.info('Verified database integrity :smile_cat:')

        // only genesis block? special case of first round needs to be dealt with
        if (block.data.height === 1) {
          await blockchain.database.deleteRound(1)
        }

        /*********************************
         *  state machine data init      *
         ********************************/
        const constants = config.getConstants(block.data.height)
        state.lastBlock = block
        state.lastDownloadedBlock = block

        if (state.networkStart) {
          await blockchain.database.buildWallets(block.data.height)
          await blockchain.database.saveWallets(true)
          await blockchain.database.applyRound(block.data.height)
          await blockchain.transactionPool.buildWallets()

          return blockchain.dispatch('STARTED')
        }

        state.rebuild = (slots.getTime() - block.data.timestamp > (constants.activeDelegates + 1) * constants.blocktime)
        // no fast rebuild if in last week
        state.fastRebuild = (slots.getTime() - block.data.timestamp > 3600 * 24 * 7) && !!container.resolveOptions('blockchain').fastRebuild

        if (process.env.NODE_ENV === 'test') {
          logger.verbose('TEST SUITE DETECTED! SYNCING WALLETS AND STARTING IMMEDIATELY. :bangbang:')

          state.lastBlock = new Block(config.genesisBlock)
          await blockchain.database.buildWallets(block.data.height)

          return blockchain.dispatch('STARTED')
        }

        logger.info(`Fast rebuild: ${state.fastRebuild}`)
        logger.info(`Last block in database: ${block.data.height.toLocaleString()}`)

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

        // NOTE: if the node is shutdown between round, the round has already been applied
        if (blockchain.database.isNewRound(block.data.height + 1)) {
          const round = blockchain.database.getRound(block.data.height + 1)

          logger.info(`New round ${round} detected. Cleaning calculated data before restarting!`)

          await blockchain.database.deleteRound(round)
        }

        await blockchain.database.applyRound(block.data.height)
        await blockchain.transactionPool.buildWallets()

        return blockchain.dispatch('STARTED')
      } catch (error) {
        logger.error(error.stack)

        return blockchain.dispatch('FAILURE')
      }
    },

    async rebuildBlocks () {
      const lastBlock = state.lastDownloadedBlock || state.lastBlock
      const blocks = await blockchain.p2p.downloadBlocks(lastBlock.data.height)

      tickSyncTracker(blocks.length)

      if (!blocks || blocks.length === 0) {
        logger.info('No new blocks found on this peer')

        blockchain.dispatch('NOBLOCK')
      } else {
        logger.info(`Downloaded ${blocks.length} new blocks accounting for a total of ${blocks.reduce((sum, b) => sum + b.numberOfTransactions, 0)} transactions`)
        if (blocks.length && blocks[0].previousBlock === lastBlock.data.id) {
          state.lastDownloadedBlock = {data: blocks.slice(-1)[0]}
          blockchain.rebuildQueue.push(blocks)
          blockchain.dispatch('DOWNLOADED')
        } else {
          // state.lastDownloadedBlock = state.lastBlock

          logger.warn('Downloaded block not accepted: ' + JSON.stringify(blocks[0]))
          logger.warn('Last block: ' + JSON.stringify(lastBlock.data))

          // disregard the whole block list
          blockchain.dispatch('NOBLOCK')
        }
      }
    },

    async downloadBlocks () {
      const lastBlock = state.lastDownloadedBlock || state.lastBlock
      const blocks = await blockchain.p2p.downloadBlocks(lastBlock.data.height)

      if (!blocks || blocks.length === 0) {
        logger.info('No new block found on this peer')

        state.noBlockCounter++

        blockchain.dispatch('NOBLOCK')
      } else {
        logger.info(`Downloaded ${blocks.length} new blocks accounting for a total of ${blocks.reduce((sum, b) => sum + b.numberOfTransactions, 0)} transactions`)

        if (blocks.length && blocks[0].previousBlock === lastBlock.data.id) {
          state.noBlockCounter = 0
          state.lastDownloadedBlock = {data: blocks.slice(-1)[0]}

          blockchain.processQueue.push(blocks)

          blockchain.dispatch('DOWNLOADED')
        } else {
          state.lastDownloadedBlock = state.lastBlock

          logger.warn('Downloaded block not accepted: ' + JSON.stringify(blocks[0]))
          logger.warn('Last block: ' + JSON.stringify(lastBlock.data))

          blockchain.p2p.suspendPeer(blocks[0].ip)

          // disregard the whole block list
          blockchain.dispatch('FORK')
        }
      }
    },

    async analyseFork () {
      logger.info('Analysing fork :mag:')
    },

    async startForkRecovery () {
      logger.info('Starting fork recovery :fork_and_knife:')

      await blockchain.database.saveBlockCommit()
      // state.forked = true
      let random = ~~(4 / Math.random())

      if (random > 102) {
        random = 102
      }

      await blockchain.removeBlocks(random)

      logger.info(`Removed ${random} blocks :wastebasket:`)

      await blockchain.p2p.resetSuspendedPeers()

      blockchain.dispatch('SUCCESS')
    }
  }
}

module.exports = blockchainMachine
