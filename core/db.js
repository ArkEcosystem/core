const Sequelize = require('sequelize')
const arkjs = require('arkjs')
const Block = require('../model/block')
const Transaction = require('../model/transaction')
const Account = require('../model/account')
const config = require('./config')
const logger = require('./logger')
const schema = require('./schema')

let instance

class DB {
  constructor () {
    if (!instance) {
      instance = this
    }
    return instance
  }

  init (params) {
    if (this.db) {
      return Promise.reject(new Error('Already initialised'))
    }
    this.localaccounts = {}
    this.db = new Sequelize(params.uri, {
      dialect: params.dialect,
      logging: false
    })
    return this.db
      .authenticate()
      .then(() => schema.syncTables(this.db))
      .then((tables) => ([this.blocks, this.transactions, this.accounts, this.rounds] = tables))
  }

  buildDelegates (block) {
    const activeDelegates = config.getConstants(block.data.height).activeDelegates
    const that = this
    return this.accounts
      .findAll({
        attributes: [
          ['vote', 'publicKey'],
          [Sequelize.fn('SUM', Sequelize.col('balance')), 'balance']
        ],
        group: 'vote',
        where: {
          vote: {
            [Sequelize.Op.ne]: null
          }
        }
      })
      .then((data) => {
        if (data.length < activeDelegates) {
          return this.accounts
            .findAll({
              attributes: [
                'publicKey'
              ],
              where: {
                username: {
                  [Sequelize.Op.ne]: null
                }
              },
              order: [[ 'publicKey', 'ASC' ]],
              limit: activeDelegates - data.length
            })
            .then((data2) => data.concat(data2))
        } else return Promise.resolve(data)
      })
      .then((data) => {
        // logger.info(`got ${data.length} voted delegates`);
        that.activedelegates = data
          .sort((a, b) => b.balance - a.balance)
          .slice(0, 51)
          .map((a) => Object.assign({round: parseInt(block.data.height / 51)}, a.dataValues))
        logger.info(`generated ${that.activedelegates.length} active delegates`)
        return Promise.resolve(that.activedelegates)
      })
  }

  buildAccounts () {
    return this.transactions
      .findAll({
        attributes: [
          'recipientId',
          [Sequelize.fn('SUM', Sequelize.col('amount')), 'amount']
        ],
        group: 'recipientId'
      })
      .then((data) => {
        data.forEach((row) => {
          const account = this.localaccounts[row.recipientId] || new Account(row.recipientId)
          account.balance = row.amount
          this.localaccounts[row.recipientId] = account
        })
        return this.blocks.findAll({
          attributes: [
            'generatorPublicKey',
            [Sequelize.fn('SUM', Sequelize.col('reward')), 'reward'],
            [Sequelize.fn('SUM', Sequelize.col('totalFee')), 'totalFee']
          ],
          group: 'generatorPublicKey'}
        )
      }).then((data) => {
        data.forEach((row) => {
          let account = this.localaccounts[arkjs.crypto.getAddress(row.generatorPublicKey, config.network.pubKeyHash)]
          if (account) {
            account.balance += row.reward + row.totalFee
          } else {
            account = new Account(arkjs.crypto.getAddress(row.generatorPublicKey, config.network.pubKeyHash))
            account.publicKey = row.generatorPublicKey
            account.balance = row.reward + row.totalFee
            this.localaccounts[account.address] = account
          }
        })
        return this.transactions.findAll({
          attributes: [
            'senderPublicKey',
            [Sequelize.fn('SUM', Sequelize.col('amount')), 'amount'],
            [Sequelize.fn('SUM', Sequelize.col('fee')), 'fee']
          ],
          group: 'senderPublicKey'}
        )
      })
      .then((data) => {
        data.forEach((row) => {
          let account = this.localaccounts[arkjs.crypto.getAddress(row.senderPublicKey, config.network.pubKeyHash)]
          if (account) {
            account.publicKey = row.senderPublicKey
            account.balance -= row.amount + row.fee
          } else {
            account = new Account(arkjs.crypto.getAddress(row.senderPublicKey, config.network.pubKeyHash))
            account.publicKey = row.senderPublicKey
            account.balance = -row.amount - row.fee
            this.localaccounts[account.address] = account
            logger.error(account.address, row.amount, row.fee)
          }
        })
        logger.info('SPV rebuild finished', Object.keys(this.localaccounts).length)
        return this.transactions.findAll({
          attributes: [
            'senderPublicKey',
            'serialized'
          ],
          where: {type: 1}}
        )
      }).then((data) => {
        data.forEach((row) => {
          const account = this.localaccounts[arkjs.crypto.getAddress(row.senderPublicKey, config.network.pubKeyHash)]
          account.secondPublicKey = Transaction.deserialize(row.serialized.toString('hex')).asset.signature.publicKey
        })
        return this.transactions.findAll({
          attributes: [
            'senderPublicKey',
            'serialized'
          ],
          where: {type: 2}}
        )
      }).then((data) => {
        data.forEach((row) => {
          const account = this.localaccounts[arkjs.crypto.getAddress(row.senderPublicKey, config.network.pubKeyHash)]
          account.username = Transaction.deserialize(row.serialized.toString('hex')).asset.delegate.username
        })
        Object.keys(this.localaccounts)
          .filter((a) => this.localaccounts[a].balance < 0)
          .forEach((a) => logger.info(this.localaccounts[a]))
        return this.transactions.findAll({
          attributes: [
            'senderPublicKey',
            'serialized'
          ],
          order: [[ 'createdAt', 'DESC' ]],
          where: {type: 3}}
        )
      }).then((data) => {
        data.forEach((row) => {
          const account = this.localaccounts[arkjs.crypto.getAddress(row.senderPublicKey, config.network.pubKeyHash)]
          if (!account.voted) {
            let vote = Transaction.deserialize(row.serialized.toString('hex')).asset.votes[0]
            if (vote.startsWith('+')) account.vote = vote.slice(1)
            account.voted = true
          }
        })
        return this.saveAccounts().then(() => this.localaccounts || [])
      })
      .catch((error) => logger.error(error))
  }

  saveAccounts (force) {
    return this.db.transaction((t) =>
      Object.values(this.localaccounts || [])
        .filter((acc) => force || (acc.dirty && acc.publicKey))
        .map((acc) => this.accounts.upsert(acc, t))
    ).then(() => Object.values(this.localaccounts).forEach((acc) => (acc.dirty = false)))
  }

  saveBlock (block) {
    return this.blocks
      .create(block.data)
      .then(() => this.transactions.bulkCreate(block.transactions || []))
  }

  getBlock (id) {
    return this.blocks
      .findOne({id: id})
      .then((data) => Promise.resolve(new Block(data)))
  }

  getBlocks (offset, limit) {
    const last = offset + limit
    return this.blocks
      .findAll({
        include: [{
          model: this.transactions,
          attributes: ['serialized']
        }],
        attributes: {
          exclude: ['createdAt', 'updatedAt']
        },
        where: {
          height: {
            [Sequelize.Op.between]: [offset, last]
          }
        }
      })
      .then((blocks) => {
        const nblocks = blocks.map((block) => {
          block.dataValues.transactions = block.dataValues.transactions.map((tx) => {
            return tx.serialized.toString('hex')
          })
          return block.dataValues
        })
        return Promise.resolve(nblocks)
      })
  }

  applyRound (block, fastRebuild) {
    if ((!fastRebuild && block.data.height % config.getConstants(block.data.height).activeDelegates === 0) || block.data.height === 1) {
      logger.info('New round', block.data.height / config.getConstants(block.data.height).activeDelegates)
      return this
        .saveAccounts()
        .then(() => this.buildDelegates(block))
        .then(() => this.rounds.bulkCreate(this.activedelegates))
        .then(() => block)
    } else return Promise.resolve(block)
  }

  applyBlock (block, fastRebuild) {
    const generator = arkjs.crypto.getAddress(block.data.generatorPublicKey, config.network.pubKeyHash)
    let delegate = this.localaccounts[generator]
    if (!delegate && block.data.height === 1) {
      delegate = new Account(generator)
      delegate.publicKey = block.data.generatorPublicKey
      this.localaccounts[generator] = delegate
    }
    const appliedTransactions = []
    const that = this
    return Promise
      .all(
        block.transactions.map(
          (tx) => this
            .applyTransaction(tx)
            .then(() => appliedTransactions.push(tx))
        )
      )
      .then(() => delegate.applyBlock(block.data))
      .then(() => this.applyRound(block, fastRebuild))
      .catch((error) => {
        return Promise
          .all(appliedTransactions.map((tx) => that.undoTransaction(tx)))
          .then(() => Promise.reject(error))
      })
  }

  applyTransaction (transaction) {
    const senderId = arkjs.crypto.getAddress(transaction.data.senderPublicKey, config.network.pubKeyHash)
    const recipientId = transaction.data.recipientId // may not exist
    let sender = this.localaccounts[senderId] // should exist
    if (!sender.publicKey) sender.publicKey = transaction.data.senderPublicKey
    let recipient = this.localaccounts[recipientId]
    if (!recipient && recipientId) { // cold wallet
      recipient = new Account(recipientId)
      this.localaccounts[recipientId] = recipient
    }
    if (!config.network.exceptions[transaction.data.id] && !sender.canApply(transaction.data)) {
      logger.error(sender)
      logger.error(JSON.stringify(transaction.data))
      return Promise.reject(new Error(`Can't apply transaction ${transaction.data.id}`))
    }
    sender.applyTransactionToSender(transaction.data)
    if (recipient) recipient.applyTransactionToRecipient(transaction.data)
    // if (sender.vote) {
    //   const delegateAdress = arkjs.crypto.getAddress(transaction.data.asset.votes[0].slice(1), config.network.pubKeyHash)
    //   const delegate = this.localaccounts[delegateAdress]
    //   delegate.applyVote(sender, transaction.data.asset.votes[0])
    // }
    return Promise.resolve(transaction)
  }

  undoTransaction (transaction) {
    const senderId = arkjs.crypto.getAddress(transaction.data.senderPublicKey, config.network.pubKeyHash)
    const recipientId = transaction.data.recipientId // may not exist
    let sender = this.localaccounts[senderId] // should exist
    let recipient = this.localaccounts[recipientId]
    sender.undoTransactionToSender(transaction.data)
    if (recipient) recipient.undoTransactionToRecipient(transaction.data)
    return Promise.resolve(transaction.data)
  }

  getLastBlock () {
    return this.blocks
      .findOne({order: [['height', 'DESC']]})
      .then((data) => {
        if (data) {
          return Promise.resolve(data)
        } else {
          return Promise.reject(new Error('No block found in database'))
        }
      })
      .then((block) =>
        this.transactions
          .findAll({where: {blockId: block.id}})
          .then((data) => {
            block.transactions = data.map((tx) => Transaction.deserialize(tx.serialized.toString('hex')))
            return Promise.resolve(new Block(block))
          })
      )
  }
}

module.exports = new DB()
