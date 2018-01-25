const Op = require('sequelize').Op
const moment = require('moment')
const Transaction = requireFrom('model/transaction')
const buildFilterQuery = require('../utils/filter-query')

class TransactionsRepository {
  constructor (db) {
    this.db = db
  }

  findAll (queryParams) {
    let whereStatement = {}
    let orderBy = []

    const filter = ['type', 'senderPublicKey', 'recipientId', 'amount', 'fee', 'blockId']
    for (const elem of filter) {
      if (queryParams[elem]) { whereStatement[elem] = queryParams[elem] }
    }

    if (queryParams['senderId']) {
      let account = this.db.accountManager.getAccountByAddress([queryParams['senderId']])

      if (account) whereStatement['senderPublicKey'] = account.publicKey
    }

    if (queryParams.orderBy) {
      const order = queryParams.orderBy.split(':')

      if (['timestamp', 'type', 'amount'].includes(order[0])) orderBy.push(queryParams.orderBy.split(':'))
    }

    return this.db.transactionsTable.findAndCountAll({
      attributes: ['blockId', 'serialized'],
      where: whereStatement,
      order: orderBy,
      offset: queryParams.offset,
      limit: queryParams.limit,
      include: {
        model: this.db.blocksTable,
        attributes: ['height']
      }
    })
  }

  findAllByWallet (wallet, paginator) {
    return this.findAll(Object.assign({
      [Op.or]: [{
        senderPublicKey: wallet.publicKey
      }, {
        recipientId: wallet.address
      }]
    }, paginator))
  }

  findAllBySender (senderPublicKey, paginator) {
    return this.findAll(Object.assign({senderPublicKey}, paginator))
  }

  findAllByRecipient (recipientId, paginator) {
    return this.findAll(Object.assign({recipientId}, paginator))
  }

  allVotesBySender (senderPublicKey, paginator) {
    return this.findAll(Object.assign({senderPublicKey, type: 3}, paginator))
  }

  findAllByBlock (blockId, paginator) {
    return this.findAll(Object.assign({blockId}, paginator))
  }

  findAllByType (type, paginator) {
    return this.findAll(Object.assign({type}, paginator))
  }

  findById (id) {
    return this.db.transactionsTable.findById(id, {
      include: {
        model: this.db.blocksTable,
        attributes: ['height']
      }
    })
  }

  findByIdAndType (id, type) {
    return this.db.transactionsTable.findOne({
      where: {id, type},
      include: {
        model: this.db.blocksTable,
        attributes: ['height']
      }
    })
  }

  findAllByDateAndType (type, from, to) {
    return this.db.transactionsTable.findAndCountAll({
      attributes: ['serialized'],
      where: {
        type: type,
        createdAt: {
          [Op.lte]: moment(to).endOf('day').toDate(),
          [Op.gte]: moment(from).startOf('day').toDate()
        }
      },
      include: {
        model: this.db.blocksTable,
        attributes: ['height']
      }
    }).then(results => {
      return {
        count: results.count,
        rows: results.rows.map(row => Transaction.deserialize(row.serialized.toString('hex')))
      }
    })
  }

  search (params) {
    return this.db.transactionsTable.findAndCountAll({
      attributes: ['blockId', 'serialized'],
      where: buildFilterQuery(
        params,
        {
          exact: ['id', 'blockId', 'type', 'version', 'senderPublicKey', 'recipientId'],
          between: ['timestamp', 'amount', 'fee'],
          wildcard: ['vendorFieldHex']
        }
      ),
      include: {
        model: this.db.blocksTable,
        attributes: ['height']
      }
    })
  }
}

module.exports = TransactionsRepository
