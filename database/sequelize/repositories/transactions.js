const Op = require('sequelize').Op

class TransactionsRepository {
  constructor(db) {
    this.db = db
  }

  all(params = {}) {
    return this.db.transactionsTable.findAndCountAll(params)
  }

  paginate(page, perPage, params = {}) {
    let offset = 0

    if (page > 1) {
      offset = page * perPage
    }

    return this.db.transactionsTable.findAndCountAll(Object.assign(params, {
      offset: offset,
      limit: perPage,
    }))
  }

  paginateAllByWallet(wallet, page, perPage) {
    return this.paginate(page, perPage, {
      where: {
        [Op.or]: [{
          senderPublicKey: wallet.publicKey,
        }, {
          recipientId: wallet.address,
        }]
      }
    })
  }

  paginateAllBySender(senderPublicKey, page, perPage) {
    return this.paginate(page, perPage, {
      where: {
          senderPublicKey: senderPublicKey,
      }
    })
  }

  paginateAllByRecipient(recipientId, page, perPage) {
    return this.paginate(page, perPage, {
      where: {
        recipientId: recipientId,
      }
    })
  }

  paginateVotesBySender(senderPublicKey, page, perPage) {
    return this.paginate(page, perPage, {
      where: {
        senderPublicKey: senderPublicKey,
        type: 3
      }
    })
  }

  paginateByBlock(blockId, page, perPage) {
    return this.paginate(page, perPage, {
      where: {
        blockId: blockId
      }
    })
  }

  paginateByType(type, page, perPage) {
    return this.paginate(page, perPage, {
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
}

module.exports = TransactionsRepository
