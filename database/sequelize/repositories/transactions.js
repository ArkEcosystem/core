const Op = require('sequelize').Op
const moment = require('moment')
const Transaction = requireFrom('model/transaction')
const buildFilterQuery = require('../utils/filter-query')

class TransactionsRepository {
  constructor (db) {
    this.db = db
  }

  all (queryParams) {
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

  paginate (pager, queryParams = {}) {
    return this.all(Object.assign(queryParams, {
      offset: pager.offset,
      limit: pager.offset * pager.limit
    }))
  }

  paginateAllByWallet (wallet, pager) {
    return this.paginate(pager, {
      [Op.or]: [{
        senderPublicKey: wallet.publicKey
      }, {
        recipientId: wallet.address
      }]
    })
  }

  paginateAllBySender (senderPublicKey, pager) {
    return this.paginate(pager, { senderPublicKey })
  }

  paginateAllByRecipient (recipientId, pager) {
    return this.paginate(pager, { recipientId })
  }

  paginateVotesBySender (senderPublicKey, pager) {
    return this.paginate(pager, { senderPublicKey, type: 3 })
  }

  paginateByBlock (blockId, pager) {
    return this.paginate(pager, { blockId })
  }

  paginateByType (type, pager) {
    return this.paginate(pager, { type })
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

  allByDateAndType (type, from, to) {
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
