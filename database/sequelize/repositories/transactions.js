const Op = require('sequelize').Op
const moment = require('moment')

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
      let account = this.db.localaccounts[queryParams['senderId']]
      if (account) {
        whereStatement['senderPublicKey'] = account.publicKey
      }
    }

    if (queryParams.orderBy) {
      let order = queryParams.orderBy.split(':')
      if (['timestamp', 'type', 'amount'].includes(order[0])) {
        orderBy.push(queryParams.orderBy.split(':'))
      }
    }

    return this.db.transactionsTable.findAndCountAll({
      where: whereStatement,
      order: orderBy,
      offset: parseInt(queryParams.offset || 1),
      limit: parseInt(queryParams.limit || 100),
      include: {
        model: this.db.blocksTable,
        attributes: ['height']
      }
    })
  }

  paginate (pager, queryParams = {}) {
    let offset = 0

    if (pager.page > 1) {
      offset = pager.page * pager.perPage
    }

    return this.all(Object.assign(queryParams, {
      offset: offset,
      limit: pager.perPage
    }))
  }

  paginateAllByWallet (wallet, pager) {
    return this.paginate(pager, {
      where: {
        [Op.or]: [{
          senderPublicKey: wallet.publicKey
        }, {
          recipientId: wallet.address
        }]
      }
    })
  }

  paginateAllBySender (senderPublicKey, pager) {
    return this.paginate(pager, {
      where: {
          senderPublicKey: senderPublicKey
      }
    })
  }

  paginateAllByRecipient (recipientId, pager) {
    return this.paginate(pager, {
      where: {
        recipientId: recipientId
      }
    })
  }

  paginateVotesBySender (senderPublicKey, pager) {
    return this.paginate(pager, {
      where: {
        senderPublicKey: senderPublicKey,
        type: 3
      }
    })
  }

  paginateByBlock (blockId, pager) {
    return this.paginate(pager, {
      where: {
        blockId: blockId
      }
    })
  }

  paginateByType (type, pager) {
    return this.paginate(pager, {
      where: {
        type: type
      }
    })
  }

  findById (id) {
    return this.db.transactionsTable.findById(id)
  }

  findByIdAndType (id, type) {
    return this.db.transactionsTable.findOne({
      where: {
        id: id,
        type: type
      }
    })
  }

  allByDateAndType (type, from, to) {
    return this.db.transactionsTable.findAndCountAll({
      attributes: ['amount', 'fee'],
      where: {
        type: type,
        createdAt: {
          [Op.lte]: moment(to).endOf('day').toDate(),
          [Op.gte]: moment(from).startOf('day').toDate()
        }
      }
    })
  }
}

module.exports = TransactionsRepository
