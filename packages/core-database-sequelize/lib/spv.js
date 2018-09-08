const { Transaction } = require('@arkecosystem/crypto').models
const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const config = container.resolvePlugin('config')

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
    logger.info(`SPV rebuild finished, wallets in memory: ${Object.keys(this.walletManager.byAddress).length}`)
    logger.info(`Number of registered delegates: ${Object.keys(this.walletManager.byUsername).length}`)
  }

  /**
   * Load and apply received transactions to wallets.
   * @return {void}
   */
  async __buildReceivedTransactions () {
    const data = await this.query
      .select('recipient_id')
      .sum('amount', 'amount')
      .from('transactions')
      .where('type', TRANSACTION_TYPES.TRANSFER)
      .groupBy('recipient_id')
      .all()

    data.forEach(row => {
      const wallet = this.walletManager.findByAddress(row.recipientId)

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
    const data = await this.query
      .select('generator_public_key')
      .sum(['reward', 'total_fee'], 'reward')
      .from('blocks')
      .groupBy('generator_public_key')
      .all()

    data.forEach(row => {
      const wallet = this.walletManager.findByPublicKey(row.generatorPublicKey)
      wallet.balance += parseInt(row.reward)
    })
  }

  /**
   * Load and apply last forged blocks to wallets.
   * @return {void}
   */
  async __buildLastForgedBlocks () {
    const data = await this.query
      .select('id', 'generator_public_key', 'timestamp')
      .from('blocks')
      .orderBy('timestamp', 'DESC')
      .limit(this.activeDelegates)
      .all()

    data.forEach(row => {
      const wallet = this.walletManager.findByPublicKey(row.generatorPublicKey)
      wallet.lastBlock = row
    })
  }

  /**
   * Load and apply sent transactions to wallets.
   * @return {void}
   */
  async __buildSentTransactions () {
    const data = await this.query
      .select('sender_public_key')
      .sum('amount', 'amount')
      .sum('fee', 'fee')
      .from('transactions')
      .groupBy('sender_public_key')
      .all()

    data.forEach(row => {
      let wallet = this.walletManager.findByPublicKey(row.senderPublicKey)
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
    const data = await this.query
      .select('sender_public_key', 'serialized')
      .from('transactions')
      .where('type', TRANSACTION_TYPES.SECOND_SIGNATURE)
      .all()

    data.forEach(row => {
      const wallet = this.walletManager.findByPublicKey(row.senderPublicKey)
      wallet.secondPublicKey = Transaction.deserialize(row.serialized.toString('hex')).asset.signature.publicKey
    })
  }

  /**
   * Load and apply delegate usernames to wallets.
   * @return {void}
   */
  async __buildDelegates () {
    // Register...
    const transactions = await this.query
      .select('sender_public_key', 'serialized')
      .from('transactions')
      .where('type', TRANSACTION_TYPES.DELEGATE_REGISTRATION)
      .all()

    for (let i = 0; i < transactions.length; i++) {
      const wallet = this.walletManager.findByPublicKey(transactions[i].senderPublicKey)
      wallet.username = Transaction.deserialize(transactions[i].serialized.toString('hex')).asset.delegate.username

      this.walletManager.reindex(wallet)
    }

    // Rate...
    const delegates = await this.query
      .select('public_key', 'vote_balance', 'missed_blocks')
      .from('wallets')
      .whereIn('public_key', transactions.map(transaction => transaction.senderPublicKey))
      .orderBy({
        'vote_balance': 'DESC',
        'public_key': 'ASC'
      })
      .all()

    // Forged Blocks...
    const forgedBlocks = await this.query
      .select('generator_public_key')
      .sum('total_fee', 'totalFees')
      .sum('reward', 'totalRewards')
      .count('total_amount', 'totalProduced')
      .from('blocks')
      .whereIn('generator_public_key', transactions.map(transaction => transaction.senderPublicKey))
      .groupBy('generator_public_key')
      .all()

    for (let i = 0; i < delegates.length; i++) {
      const forgedBlock = forgedBlocks.filter(block => {
        return block.generatorPublicKey === delegates[i].publicKey
      })[0]

      const wallet = this.walletManager.findByPublicKey(delegates[i].publicKey)
      wallet.voteBalance = delegates[i].voteBalance
      wallet.missedBlocks = parseInt(delegates[i].missedBlocks)

      if (forgedBlock) {
        wallet.forgedFees = +forgedBlock.totalFees
        wallet.forgedRewards = +forgedBlock.totalRewards
        wallet.producedBlocks = +forgedBlock.totalProduced
      }

      this.walletManager.reindex(wallet)
    }
  }

  /**
   * Load and apply votes to wallets.
   * @return {void}
   */
  async __buildVotes () {
    const data = await this.query
      .select('sender_public_key', 'serialized')
      .from('transactions')
      .where('type', TRANSACTION_TYPES.VOTE)
      .orderBy('created_at', 'DESC')
      .all()

    data.forEach(row => {
      const wallet = this.walletManager.findByPublicKey(row.senderPublicKey)

      if (!wallet.voted) {
        const vote = Transaction.deserialize(row.serialized.toString('hex')).asset.votes[0]
        if (vote.startsWith('+')) {
          wallet.vote = vote.slice(1)
        }
        wallet.voted = true
      }
    })

    this.walletManager.updateDelegates()
  }

  /**
   * Load and apply multisignatures to wallets.
   * @return {void}
   */
  async __buildMultisignatures () {
    const data = await this.query
      .select('sender_public_key', 'serialized')
      .from('transactions')
      .where('type', TRANSACTION_TYPES.MULTI_SIGNATURE)
      .orderBy('created_at', 'DESC')
      .all()

    data.forEach(row => {
      const wallet = this.walletManager.findByPublicKey(row.senderPublicKey)

      if (!wallet.multisignature) {
        wallet.multisignature = Transaction.deserialize(row.serialized.toString('hex')).asset.multisignature
      }
    })
  }
}
