const { Bignum, models: { Transaction } } = require('@arkecosystem/crypto')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const config = container.resolvePlugin('config')
const queries = require('./queries')
const genesisWallets = config.genesisBlock.transactions.map(tx => tx.senderId)

module.exports = class SPV {
  /**
   * Create a new wallet builder instance.
   * @param  {SequelizeConnection} database
   * @return {void}
   */
  constructor (database) {
    this.connection = database.connection
    this.models = database.models
    this.walletManager = database.walletManager
    this.query = database.query
  }

  /**
   * Perform the SPV (Simple Payment Verification).
   * @param  {Number} height
   * @return {void}
   */
  async build (height) {
    this.activeDelegates = config.getConstants(height).activeDelegates

    logger.printTracker('SPV', 1, 8, 'Received Transactions')
    await this.__buildReceivedTransactions()

    logger.printTracker('SPV', 2, 8, 'Block Rewards')
    await this.__buildBlockRewards()

    logger.printTracker('SPV', 3, 8, 'Last Forged Blocks')
    await this.__buildLastForgedBlocks()

    logger.printTracker('SPV', 4, 8, 'Sent Transactions')
    await this.__buildSentTransactions()

    logger.printTracker('SPV', 5, 8, 'Second Signatures')
    await this.__buildSecondSignatures()

    logger.printTracker('SPV', 6, 8, 'Delegates')
    await this.__buildDelegates()

    logger.printTracker('SPV', 7, 8, 'Votes')
    await this.__buildVotes()

    logger.printTracker('SPV', 8, 8, 'MultiSignatures')
    await this.__buildMultisignatures()

    logger.stopTracker('SPV', 8, 8)
    logger.info(`SPV rebuild finished, wallets in memory: ${Object.keys(this.walletManager.byAddress).length}`)
    logger.info(`Number of registered delegates: ${Object.keys(this.walletManager.byUsername).length}`)
  }

  /**
   * Load and apply received transactions to wallets.
   * @return {void}
   */
  async __buildReceivedTransactions () {
    const transactions = await this.query.many(queries.spv.receivedTransactions)

    for (const transaction of transactions) {
      const wallet = this.walletManager.findByAddress(transaction.recipientId)

      wallet
        ? wallet.balance = new Bignum(transaction.amount)
        : logger.warn(`Lost cold wallet: ${transaction.recipientId} ${transaction.amount}`)
    }
  }

  /**
   * Load and apply block rewards to wallets.
   * @return {void}
   */
  async __buildBlockRewards () {
    const blocks = await this.query.many(queries.spv.blockRewards)

    for (const block of blocks) {
      const wallet = this.walletManager.findByPublicKey(block.generatorPublicKey)
      wallet.balance = wallet.balance.plus(block.reward)
    }
  }

  /**
   * Load and apply last forged blocks to wallets.
   * @return {void}
   */
  async __buildLastForgedBlocks () {
    const blocks = await this.query.many(queries.spv.lastForgedBlocks, {
      limit: this.activeDelegates
    })

    for (const block of blocks) {
      const wallet = this.walletManager.findByPublicKey(block.generatorPublicKey)
      wallet.lastBlock = block
    }
  }

  /**
   * Load and apply sent transactions to wallets.
   * @return {void}
   */
  async __buildSentTransactions () {
    const transactions = await this.query.many(queries.spv.sentTransactions)

    for (const transaction of transactions) {
      let wallet = this.walletManager.findByPublicKey(transaction.senderPublicKey)
      wallet.balance = wallet.balance.minus(transaction.amount).minus(transaction.fee)

      if (wallet.balance.isLessThan(0) && !this.isGenesis(wallet)) {
        logger.warn(`Negative balance: ${wallet}`)
      }
    }
  }

  /**
   * Used to determine if a wallet is a Genesis wallet.
   * @return {Boolean}
   */
  isGenesis (wallet) {
    return genesisWallets.includes(wallet.address)
  }

  /**
   * Load and apply second signature transactions to wallets.
   * @return {void}
   */
  async __buildSecondSignatures () {
    const transactions = await this.query.manyOrNone(queries.spv.secondSignatures)

    for (const transaction of transactions) {
      const wallet = this.walletManager.findByPublicKey(transaction.senderPublicKey)
      wallet.secondPublicKey = Transaction.deserialize(transaction.serialized.toString('hex')).asset.signature.publicKey
    }
  }

  /**
   * Load and apply delegate usernames to wallets.
   * @return {void}
   */
  async __buildDelegates () {
    // Register...
    const transactions = await this.query.manyOrNone(queries.spv.delegates)

    transactions.forEach(transaction => {
      const wallet = this.walletManager.findByPublicKey(transaction.senderPublicKey)
      wallet.username = Transaction.deserialize(transaction.serialized.toString('hex')).asset.delegate.username
      this.walletManager.reindex(wallet)
    })

    // Forged Blocks...
    const forgedBlocks = await this.query.manyOrNone(queries.spv.delegatesForgedBlocks)
    forgedBlocks.forEach(block => {
      const wallet = this.walletManager.findByPublicKey(block.generatorPublicKey)
      wallet.forgedFees = wallet.forgedFees.plus(block.totalFees)
      wallet.forgedRewards = wallet.forgedRewards.plus(block.totalRewards)
      wallet.producedBlocks = +block.totalProduced
    })

    // NOTE: This is highly NOT reliable, however the number of missed blocks is NOT used for the consensus
    const delegates = await this.query.manyOrNone(queries.spv.delegatesRanks)
    delegates.forEach(delegate => {
      const wallet = this.walletManager.findByPublicKey(delegate.publicKey)
      wallet.missedBlocks = parseInt(delegate.missedBlocks)
      this.walletManager.reindex(wallet)
    })
  }

  /**
   * Load and apply votes to wallets.
   * @return {void}
   */
  async __buildVotes () {
    const transactions = await this.query.manyOrNone(queries.spv.votes)

    for (const transaction of transactions) {
      const wallet = this.walletManager.findByPublicKey(transaction.senderPublicKey)

      if (!wallet.voted) {
        const vote = Transaction.deserialize(transaction.serialized.toString('hex')).asset.votes[0]

        if (vote.startsWith('+')) {
          wallet.vote = vote.slice(1)
        }

        wallet.voted = true
      }
    }

    this.walletManager.updateDelegates()
  }

  /**
   * Load and apply multisignatures to wallets.
   * @return {void}
   */
  async __buildMultisignatures () {
    const transactions = await this.query.manyOrNone(queries.spv.multiSignatures)

    for (const transaction of transactions) {
      const wallet = this.walletManager.findByPublicKey(transaction.senderPublicKey)

      if (!wallet.multisignature) {
        wallet.multisignature = Transaction.deserialize(transaction.serialized.toString('hex')).asset.multisignature
      }
    }
  }
}
