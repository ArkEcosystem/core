module.exports = class WebhooksRepository {
  constructor (db) {
    this.db = db
  }

  paginate (params) {
    return this.db.webhooksModel.query()
      .offset(params.offset)
      .limit(params.limit)
      .range()
  }

  findById (id) {
    return this.db.webhooksModel.query().where('id', id).first()
  }

  findByEvent (event) {
    return this.db.webhooksModel.query().where('event', event)
  }

  create (data) {
    return this.db.webhooksModel.query().insert(data)
  }

  update (id, data) {
    return this.db.webhooksModel.query().update(data).where('id', id)
  }

  destroy (id) {
    return this.db.webhooksModel.query().delete().where('id', id)
  }
}
