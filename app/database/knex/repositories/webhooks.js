module.exports = class WebhooksRepository {
  constructor (db) {
    this.db = db
  }

  paginate (params) {
    return this.db.webhookModel.query()
      .offset(params.offset)
      .limit(params.limit)
      .range()
  }

  findById (id) {
    return this.db.webhookModel.query().where('id', id)
  }

  findByEvent (event) {
    return this.db.webhookModel.query().where('event', event)
  }

  create (data) {
    return this.db.webhookModel.query().insert(data)
  }

  update (id, data) {
    return this.db.webhookModel.query().update(data).where('id', id)
  }

  destroy (id) {
    return this.db.webhookModel.query().delete().where('id', id)
  }
}
