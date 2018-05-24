const Sequelize = require('sequelize')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const config = container.resolvePlugin('config')

const { Transaction } = require('@arkecosystem/crypto').models
const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants

module.exports = class WalletBuilder {
  /**
   * Create a new wallet builder instance.
   * @param  {SequelizeConnection} database
   * @return {void}
   */
  constructor (database) {
    this.connection = database.connection
    this.models = database.models
    this.walletManager = database.walletManager
  }

  /**
   * Perform the SPV (Simple Payment Verification).
   * @param  {Number} height
   * @return {void}
   */
  async build (height) {
    this.activeDelegates = config.getConstants(height).activeDelegates

    logger.printTracker('SPV Building', 1, 8, 'Received Transactions')
    await this.__buildReceivedTransactions()

    logger.printTracker('SPV Building', 2, 8, 'Block Rewards')
    await this.__buildBlockRewards()

    logger.printTracker('SPV Building', 3, 8, 'Last Forged Blocks')
    await this.__buildLastForgedBlocks()

    logger.printTracker('SPV Building', 4, 8, 'Sent Transactions')
    await this.__buildSentTransactions()

    logger.printTracker('SPV Building', 5, 8, 'Second Signatures')
    await this.__buildSecondSignatures()

    logger.printTracker('SPV Building', 6, 8, 'Delegates')
    await this.__buildDelegates()

    logger.printTracker('SPV Building', 7, 8, 'Votes')
    await this.__buildVotes()

    logger.printTracker('SPV Building', 8, 8, 'MultiSignatures')
    await this.__buildMultisignatures()

    logger.stopTracker('SPV Building', 8, 8)
    logger.info(`SPV rebuild finished, wallets in memory: ${Object.keys(this.walletManager.walletsByAddress).length}`)
    logger.info(`Number of registered delegates: ${Object.keys(this.walletManager.walletsByUsername).length}`)
  }

  /**
   * Load and apply received transactions to wallets.
   * @return {void}
   */
  async __buildReceivedTransactions () {
    const data = await this.models.transaction.findAll({
      attributes: [
        'recipientId', [Sequelize.fn('SUM', Sequelize.col('amount')), 'amount']
      ],
      where: {
        type: TRANSACTION_TYPES.TRANSFER
      },
      group: 'recipientId'
    })

    data.forEach(row => {
      const wallet = this.walletManager.getWalletByAddress(row.recipientId)

      wallet
        ? wallet.balance = parseInt(row.amount)
        : logger.warn(`Lost cold wallet: ${row.recipientId} ${row.amount}`)
    })
  }

  /**
   * Load and apply block rewards to wallets.
   * @return {void}
   */
  async __buildBlockRewards () {
    const data = await this.connection.query('SELECT "generatorPublicKey", sum("reward"+"totalFee") AS reward, COUNT(*) AS produced FROM blocks GROUP BY "generatorPublicKey"', {
      type: Sequelize.QueryTypes.SELECT
    })

    data.forEach(row => {
      const wallet = this.walletManager.getWalletByPublicKey(row.generatorPublicKey)
      wallet.balance += parseInt(row.reward)
    })
  }

  /**
   * Load and apply last forged blocks to wallets.
   * @return {void}
   */
  async __buildLastForgedBlocks () {
    const data = await this.connection.query(`SELECT id, "generatorPublicKey", "timestamp" from blocks ORDER BY "timestamp" DESC LIMIT ${this.activeDelegates}`, {
      type: Sequelize.QueryTypes.SELECT
    })

    data.forEach(row => {
      const wallet = this.walletManager.getWalletByPublicKey(row.generatorPublicKey)
      wallet.lastBlock = row
    })
  }

  /**
   * Load and apply sent transactions to wallets.
   * @return {void}
   */
  async __buildSentTransactions () {
    const data = await this.models.transaction.findAll({
      attributes: [
        'senderPublicKey', [Sequelize.fn('SUM', Sequelize.col('amount')), 'amount'],
        [Sequelize.fn('SUM', Sequelize.col('fee')), 'fee']
      ],
      group: 'senderPublicKey'
    })

    data.forEach(row => {
      let wallet = this.walletManager.getWalletByPublicKey(row.senderPublicKey)
      wallet.balance -= parseInt(row.amount) + parseInt(row.fee)

      if (wallet.balance < 0 && !this.walletManager.isGenesis(wallet)) {
        logger.warn(`Negative balance: ${wallet}`)
      }
    })
  }

  /**
   * Load and apply second signature transactions to wallets.
   * @return {void}
   */
  async __buildSecondSignatures () {
    const data = await this.models.transaction.findAll({
      attributes: [
        'senderPublicKey',
        'serialized'
      ],
      where: {
        type: TRANSACTION_TYPES.SECOND_SIGNATURE
      }
    })

    data.forEach(row => {
      const wallet = this.walletManager.getWalletByPublicKey(row.senderPublicKey)
      wallet.secondPublicKey = Transaction.deserialize(row.serialized.toString('hex')).asset.signature.publicKey
    })
  }

  /**
   * Load and apply delegate usernames to wallets.
   * @return {void}
   */
  async __buildDelegates () {
    // Register...
    const transactions = await this.models.transaction.findAll({
      attributes: [
        'senderPublicKey',
        'serialized'
      ],
      where: {
        type: TRANSACTION_TYPES.DELEGATE_REGISTRATION
      }
    })

    // Rate...
    const delegates = await this.models.wallet.findAll({
      attributes: [
        'publicKey',
        'username',
        'votebalance'
      ],
      where: {
        publicKey: {
          [Sequelize.Op.in]: transactions.map(transaction => transaction.senderPublicKey)
        }
      },
      order: [
        ['votebalance', 'DESC'],
        ['publicKey', 'ASC']
      ]
    })

    // Forged Blocks...
    const forgedBlocks = await this.models.block.findAll({
      attributes: [
        'generatorPublicKey',
        [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'totalForged'],
        [Sequelize.fn('COUNT', Sequelize.col('totalAmount')), 'totalProduced']
      ],
      where: {
        generatorPublicKey: {
          [Sequelize.Op.in]: transactions.map(transaction => transaction.senderPublicKey)
        }
      },
      group: 'generatorPublicKey'
    })

    for (let i = 0; i < delegates.length; i++) {
      const forgedBlock = forgedBlocks.filter(block => {
        return block.generatorPublicKey === delegates[i].publicKey
      })[0]

      const wallet = this.walletManager.getWalletByPublicKey(delegates[i].publicKey)
      wallet.rate = i + 1
      wallet.forged = forgedBlock ? forgedBlock.totalForged : 0
      wallet.username = delegates[i].username
      // wallet.producedBlocks = forgedBlock ? forgedBlock.totalProduced : 0 // TODO: This is breaking & causing a rollback

      this.walletManager.reindex(wallet)
    }
  }

  /**
   * Load and apply votes to wallets.
   * @return {void}
   */
  async __buildVotes () {
    const data = await this.models.transaction.findAll({
      attributes: [
        'senderPublicKey',
        'serialized'
      ],
      order: [
        ['createdAt', 'DESC']
      ],
      where: {
        type: TRANSACTION_TYPES.VOTE
      }
    })

    data.forEach(row => {
      const wallet = this.walletManager.getWalletByPublicKey(row.senderPublicKey)

      if (!wallet.voted) {
        wallet.apply(Transaction.deserialize(row.serialized.toString('hex')))

        wallet.voted = true
      }
    })
  }

  /**
   * Load and apply multisignatures to wallets.
   * @return {void}
   */
  async __buildMultisignatures () {
    const data = await this.models.transaction.findAll({
      attributes: [
        'senderPublicKey',
        'serialized'
      ],
      order: [
        ['createdAt', 'DESC']
      ],
      where: {
        type: TRANSACTION_TYPES.MULTI_SIGNATURE
      }
    })

    data.forEach(row => {
      const wallet = this.walletManager.getWalletByPublicKey(row.senderPublicKey)
      wallet.multisignature = Transaction.deserialize(row.serialized.toString('hex')).asset.multisignature
    })
  }
}
