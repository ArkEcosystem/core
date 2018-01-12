class BlocksRepository {
  constructor(db) {
    this.db = db
  }

  all(params = {}) {
    return this.db.blocksTable.findAndCountAll(params)
  }

  paginate(page, perPage, params = {}) {
    let offset = 0

    if (page > 1) {
      offset = page * perPage
    }

    return this.db.blocksTable.findAndCountAll(Object.assign(params, {
      offset: offset,
      limit: perPage,
    }))
  }

  paginateByGenerator(generatorPublicKey, page, perPage) {
    return this.paginate(page, perPage, {
      where: {
        generatorPublicKey: generatorPublicKey
      }
    })
  }

  findById(id) {
    return this.db.blocksTable.findById(id)
  }

  findLastByPublicKey(publicKey) {
    return this.db.blocksTable.findOne({
      limit: 1,
      where: { generatorPublicKey: publicKey },
      order: [ [ 'createdAt', 'DESC' ]]
    })
  }
}

module.exports = BlocksRepository
