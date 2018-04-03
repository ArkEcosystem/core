module.exports = class WebhooksRepository {
  constructor (db) {
    this.db = db
  }

  paginate (params) {
    return this.db.models.webhook.findAndCountAll(params)
  }

  findById (id) {
    return this.db.models.webhook.findById(id)
  }

  findByEvent (event) {
    return this.db.models.webhook.findAll({ where: {event} })
  }

  create (data) {
    return this.db.models.webhook.create(data)
  }

  async update (id, data) {
    try {
      const webhook = await this.db.models.webhook.findById(id)

      webhook.update(data)
    } catch (e) {
      return false
    }
  }

  async destroy (id) {
    try {
      const webhook = await this.db.models.webhook.findById(id)

      webhook.destroy()
    } catch (e) {
      return false
    }
  }
}
