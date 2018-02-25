const moment = require('moment')
const Transaction = require('app/models/transaction')
const buildFilterQuery = require('../utils/filter-query')

module.exports = class TransactionsRepository {
  constructor (db) {
    this.db = db
  }

  findAll (params) {
    let query = this.db.transactionsModel.query().select('blockId', 'serialized')

    const filter = ['type', 'senderPublicKey', 'recipientId', 'amount', 'fee', 'blockId']
    for (const elem of filter) {
      if (params[elem]) {
        query.where(elem, params[elem])
      }
    }

    if (params['senderId']) {
      let wallet = this.db.walletManager.getWalletByAddress([params['senderId']])

      if (wallet) {
        query.where('senderPublicKey', wallet.publicKey)
      }
    }

    if (params.orderBy) {
      const order = params.orderBy.split(':')

      if (['timestamp', 'type', 'amount'].includes(order[0])) {
        const [column, direction] = params.orderBy.split(':')
        query.orderBy(column, direction)
      }
    }

    return query
      .offset(params.offset)
      .limit(params.limit)
      .range()
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
    return this.db.transactionsModel.query().findById(id).eager('blockHeight as block')
  }

  findByIdAndType (id, type) {
    return this.db.transactionsModel.query()
      .where({ id, type })
      .eager('blockHeight as block')
  }

  async findAllByDateAndType (type, start, end) {
    let query = this.db.transactionsModel.query().select('serialized')

    if (type) {
      query.where('type', type)
    }

    const epoch = moment.unix(1490101200).utc()

    if (start) {
      start = moment(start).startOf('day').utc()
      if (start.unix() < epoch.unix()) start = epoch
    }

    if (end) {
      end = moment(end).endOf('day').utc()

      query.where('timestamp', '>=', end.diff(epoch))
    }

    const rows = await query.eager('blockHeight as block').range()

    return {
      total: rows.total,
      results: rows.results.map(row => Transaction.deserialize(row.serialized.toString('hex')))
    }
  }

  search (params) {
    const query = this.db.transactionsModel.query()
      .select('blockId', 'serialized')

    return buildFilterQuery(query, params, {
      exact: ['id', 'blockId', 'type', 'version', 'senderPublicKey', 'recipientId'],
      between: ['timestamp', 'amount', 'fee'],
      wildcard: ['vendorFieldHex']
    })
    .eager('blockHeight as block')
    .offset(params.offset)
    .limit(params.limit)
    .range()
  }
}
