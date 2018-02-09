module.exports = class WebhooksRepository {
  constructor (db) {
    this.db = db
  }

  paginate (params) {
    return this.db.webhooksTable.findAndCountAll({
      offset: params.offset,
      limit: params.limit
    })
  }

  findById (id) {
    return this.db.webhooksTable.findById(id)
  }

  create (data) {
    return this.db.webhooksTable.create(data)
  }

  update (id, data) {
    return this.db.webhooksTable
      .findById(id)
      .then((webhook) => webhook.update(data))
  }

  destroy (id) {
    return this.db.webhooksTable
      .findById(id)
      .then((webhook) => webhook.destroy())
  }
}
