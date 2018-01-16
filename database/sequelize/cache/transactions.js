const CacheDecorator = require('./cache')

class TransactionsRepositoryCacheDecorator extends CacheDecorator {
  constructor (db) {
    super()

    this.db = db
  }

  all (params) {
    return super.cachePromise(
      'all',
      { params },
      this.db.transactions.all(params)
    )
  }

  paginate (pager, params = {}) {
    return super.cachePromise(
      'paginate',
      { params },
      this.db.transactions.paginate(pager, params)
    )
  }

  paginateAllByWallet (wallet, pager) {
    return super.cachePromise(
      'paginateAllByWallet',
      { wallet, pager },
      this.db.transactions.paginateAllByWallet(wallet, pager)
    )
  }

  paginateAllBySender (senderPublicKey, pager) {
    return super.cachePromise(
      'paginateAllBySender',
      { senderPublicKey, pager },
      this.db.transactions.paginateAllBySender(senderPublicKey, pager)
    )
  }

  paginateAllByRecipient (recipientId, pager) {
    return super.cachePromise(
      'paginateAllByRecipient',
      { recipientId, pager },
      this.db.transactions.paginateAllByRecipient(recipientId, pager)
    )
  }

  paginateVotesBySender (senderPublicKey, pager) {
    return super.cachePromise(
      'paginateVotesBySender',
      { senderPublicKey, pager },
      this.db.transactions.paginateVotesBySender(senderPublicKey, pager)
    )
  }

  paginateByBlock (blockId, pager) {
    return super.cachePromise(
      'paginateByBlock',
      { blockId, pager },
      this.db.transactions.paginateByBlock(blockId, pager)
    )
  }

  paginateByType (type, pager) {
    return super.cachePromise(
      'paginateByType',
      { type, pager },
      this.db.transactions.paginateByType(type, pager)
    )
  }

  findById (id) {
    return super.cachePromise(
      'findById',
      { id },
      this.db.transactions.findById(id)
    )
  }

  findByIdAndType (id, type) {
    return super.cachePromise(
      'findByIdAndType',
      { id, type },
      this.db.transactions.findByIdAndType(id, type)
    )
  }

  allByDateAndType (type, from, to) {
    return super.cachePromise(
      'allByDateAndType',
      { type, from, to },
      this.db.transactions.allByDateAndType(type, from, to)
    )
  }
}

module.exports = TransactionsRepositoryCacheDecorator
