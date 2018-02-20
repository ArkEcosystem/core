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

  findByEvent (event) {
    return this.db.webhooksTable.findAll({ where: {event} })
  }

  create (data) {
    return this.db.webhooksTable.create(data)
  }

  async update (id, data) {
    const webhook = await this.db.webhooksTable.findById(id)

    webhook.update(data)
  }

  async destroy (id) {
    const webhook = await this.db.webhooksTable.findById(id)

    webhook.destroy()
  }
}
