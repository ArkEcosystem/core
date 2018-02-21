module.exports = class WebhooksRepository {
  constructor (db) {
    this.db = db
  }

  paginate (params) {
    const query = this.db.webhooksTable.query()
      .select('*', this.db.raw('COUNT(*) as count'))
      .offset(params.offset)
      .limit(params.limit)

    return {
      count: query.count,
      rows: query
    }
  }

  findById (id) {
    return this.db.webhooksTable.query().where('id', id)
  }

  findByEvent (event) {
    return this.db.webhooksTable.query().where('event', event)
  }

  create (data) {
    return this.db.webhooksTable.query().insert(data)
  }

  update (id, data) {
    return this.db.webhooksTable.query().update(data).where('id', id)
  }

  destroy (id) {
    return this.db.webhooksTable.query().delete().where('id', id)
  }
}
