module.exports = class WebhooksRepository {
  constructor (db) {
    this.db = db
  }

  paginate (params) {
    return this.db.webhooksTable.query()
      .offset(params.offset)
      .limit(params.limit)
      .range()
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
