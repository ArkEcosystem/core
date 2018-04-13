const Op = require('sequelize').Op
const { Transaction } = require('@arkecosystem/client').models
const { TRANSACTION_TYPES } = require('@arkecosystem/client').constants
const buildFilterQuery = require('../utils/filter-query')

module.exports = class TransactionsRepository {
  constructor (db) {
    this.db = db
  }

  findAll (params) {
    let whereStatement = {}
    let orderBy = []

    const filter = ['type', 'senderPublicKey', 'recipientId', 'amount', 'fee', 'blockId']
    for (const elem of filter) {
      if (params[elem]) { whereStatement[elem] = params[elem] }
    }

    if (params['senderId']) {
      let wallet = this.db.walletManager.getWalletByAddress([params['senderId']])

      if (wallet) whereStatement['senderPublicKey'] = wallet.publicKey
    }

    params.orderBy
      ? orderBy.push([params.orderBy.split(':')])
      : orderBy.push([['timestamp', 'DESC']])

    return this.db.models.transaction.findAndCountAll({
      attributes: ['blockId', 'serialized'],
      where: whereStatement,
      order: orderBy,
      offset: params.offset,
      limit: params.limit,
      include: {
        model: this.db.models.block,
        attributes: ['height']
      }
    })
  }

  findAllByWallet (wallet, paginator) {
    return this.findAll({
      ...{
        [Op.or]: [{
          senderPublicKey: wallet.publicKey
        }, {
          recipientId: wallet.address
        }]
      },
      ...paginator
    })
  }

  findAllBySender (senderPublicKey, paginator) {
    return this.findAll({...{senderPublicKey}, ...paginator})
  }

  findAllByRecipient (recipientId, paginator) {
    return this.findAll({...{recipientId}, ...paginator})
  }

  allVotesBySender (senderPublicKey, paginator) {
    return this.findAll({...{senderPublicKey, type: TRANSACTION_TYPES.VOTE}, ...paginator})
  }

  findAllByBlock (blockId, paginator) {
    return this.findAll({...{blockId}, ...paginator})
  }

  findAllByType (type, paginator) {
    return this.findAll({...{type}, ...paginator})
  }

  findById (id) {
    return this.db.models.transaction.findById(id, {
      include: {
        model: this.db.models.block,
        attributes: ['height']
      }
    })
  }

  findByTypeAndId (type, id) {
    return this.db.models.transaction.findOne({
      where: {id, type},
      include: {
        model: this.db.models.block,
        attributes: ['height']
      }
    })
  }

  async findAllByDateAndType (type, from, to) {
    let where = { type, timestamp: {} }

    if (from) where.timestamp[Op.lte] = to
    if (to) where.timestamp[Op.gte] = from
    if (!where.timestamp.length) delete where.timestamp

    const results = await this.db.models.transaction.findAll({
      attributes: ['serialized'],
      where,
      include: {
        model: this.db.models.block,
        attributes: ['height']
      }
    })

    return results.map(row => Transaction.deserialize(row.serialized.toString('hex')))
  }

  search (payload) {
    let orderBy = []

    payload.orderBy
      ? orderBy.push([payload.orderBy.split(':')])
      : orderBy.push([['timestamp', 'DESC']])

    return this.db.models.transaction.findAndCountAll({
      attributes: ['blockId', 'serialized'],
      where: buildFilterQuery(
        payload,
        {
          exact: ['id', 'blockId', 'type', 'version', 'senderPublicKey', 'recipientId'],
          between: ['timestamp', 'amount', 'fee'],
          wildcard: ['vendorFieldHex']
        }
      ),
      order: orderBy,
      offset: payload.offset,
      limit: payload.limit,
      include: {
        model: this.db.models.block,
        attributes: ['height']
      }
    })
  }
}
