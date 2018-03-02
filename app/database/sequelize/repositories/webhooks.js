module.exports = class WebhooksRepository {
  constructor (db) {
    this.db = db
  }

  async paginate (params) {
    const results = await this.db.webhooksTable.findAndCountAll({
      offset: params.offset,
      limit: params.limit
    })

    return { results: results.rows, total: results.count }
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
