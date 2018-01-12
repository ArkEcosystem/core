const Op = require('sequelize').Op
const moment = require('moment')

class TransactionsRepository {
  constructor(db) {
    this.db = db
  }

  all(params = {}) {
    return this.db.transactionsTable.findAndCountAll(params)
  }

  paginate(pager, params = {}) {
    let offset = 0

    if (pager.page > 1) {
      offset = pager.page * pager.perPage
    }

    return this.db.transactionsTable.findAndCountAll(Object.assign(params, {
      offset: offset,
      limit: pager.perPage,
    }))
  }

  paginateAllByWallet(wallet, pager) {
    return this.paginate(pager, {
      where: {
        [Op.or]: [{
          senderPublicKey: wallet.publicKey,
        }, {
          recipientId: wallet.address,
        }]
      }
    })
  }

  paginateAllBySender(senderPublicKey, pager) {
    return this.paginate(pager, {
      where: {
          senderPublicKey: senderPublicKey,
      }
    })
  }

  paginateAllByRecipient(recipientId, pager) {
    return this.paginate(pager, {
      where: {
        recipientId: recipientId,
      }
    })
  }

  paginateVotesBySender(senderPublicKey, pager) {
    return this.paginate(pager, {
      where: {
        senderPublicKey: senderPublicKey,
        type: 3
      }
    })
  }

  paginateByBlock(blockId, pager) {
    return this.paginate(pager, {
      where: {
        blockId: blockId
      }
    })
  }

  paginateByType(type, pager) {
    return this.paginate(pager, {
      where: {
        type: type
      }
    })
  }

  findById(id) {
    return this.db.transactionsTable.findById(id)
  }

  findByIdAndType(id, type) {
    return this.db.transactionsTable.findOne({
      where: {
        id: id,
        type: type,
      }
    })
  }

  allByDateTimeRange(from, to) {
    return this.db.transactionsTable.findAndCountAll({
      attributes: ['amount', 'fee'],
      where: {
        createdAt: {
          [Op.lte]: moment(to).endOf('day').toDate(),
          [Op.gte]: moment(from).startOf('day').toDate(),
        }
      }
    })
  }
}

module.exports = TransactionsRepository
