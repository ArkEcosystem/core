const moment = require('moment')
const Transaction = require('app/models/transaction')
const buildFilterQuery = require('../utils/filter-query')

module.exports = class TransactionsRepository {
  constructor (db) {
    this.db = db
  }

  findAll (params) {
    let query = this.transactionsTable.query().select('blockId', 'serialized')

    const filter = ['type', 'senderPublicKey', 'recipientId', 'amount', 'fee', 'blockId']
    for (const elem of filter) {
      if (params[elem]) {
        query = query.where(elem, params[elem])
      }
    }

    if (params['senderId']) {
      let wallet = this.db.walletManager.getWalletByAddress([params['senderId']])

      if (wallet) {
        query = query.where('senderPublicKey', wallet.publicKey)
      }
    }

    if (params.orderBy) {
      const order = params.orderBy.split(':')

      if (['timestamp', 'type', 'amount'].includes(order[0])) {
        const [column, direction] = params.orderBy.split(':')
        query = query.orderBy(column, direction)
      }
    }

    return query
      .offset(params.offset)
      .limit(params.limit)
      .eager('blockHeight as block')
  }

  findAllByWallet (wallet, paginator) {
    return this.findAll(paginator)
      .orWhere('senderPublicKey', wallet.publicKey)
      .orWhere('recipientId', wallet.address)
  }

  findAllBySender (senderPublicKey, paginator) {
    return this.findAll({...{senderPublicKey}, ...paginator})
  }

  findAllByRecipient (recipientId, paginator) {
    return this.findAll({...{recipientId}, ...paginator})
  }

  allVotesBySender (senderPublicKey, paginator) {
    return this.findAll({...{senderPublicKey, type: 3}, ...paginator})
  }

  findAllByBlock (blockId, paginator) {
    return this.findAll({...{blockId}, ...paginator})
  }

  findAllByType (type, paginator) {
    return this.findAll({...{type}, ...paginator})
  }

  findById (id) {
    return this.db.transactionsTable.query()
      .where('id', id)
      .eager('blockHeight as block')
  }

  findByIdAndType (id, type) {
    return this.db.transactionsTable.query()
      .where({ id, type })
      .eager('blockHeight as block')
  }

  async findAllByDateAndType (type, from, to) {
    const results = await this.db.transactionsTable.query()
      .select('serialized')
      .where('type', type)
      .whereBetween('created_at', [
        moment(to).endOf('day').toDate(),
        moment(from).startOf('day').toDate()
      ])
      .eager('blockHeight as block')
      .count()

    return {
      count: results.count,
      rows: results.rows.map(row => Transaction.deserialize(row.serialized.toString('hex')))
    }
  }

  search (params) {
    const query = this.db.transactionsTable.query()

    return buildFilterQuery(query, params, {
      exact: ['id', 'blockId', 'type', 'version', 'senderPublicKey', 'recipientId'],
      between: ['timestamp', 'amount', 'fee'],
      wildcard: ['vendorFieldHex']
    }).select('blockId', 'serialized').eager('blockHeight as block')
  }
}
