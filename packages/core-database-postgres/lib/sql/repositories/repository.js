module.exports = class Repository {
  constructor (db, pgp) {
    this.db = db
    this.pgp = pgp
  }

  async truncate () {
    return this.db.none(`TRUNCATE ${this.model.getTable()} RESTART IDENTITY`)
  }

  async create (item) {
    return this.db.none(this.__insert(item))
  }

  async createMany (items) {
    for (let item of items) {
      item = this.model.transform(item)
    }

    return this.db.none(this.__insert(items))
  }

  async updateOrCreate (item) {
    return this.db.none(this.__insert(item) + ' ON CONFLICT DO UPDATE')
  }

  async updateOrCreateMany (items) {
    for (let item of items) {
      item = this.model.transform(item)
    }

    return this.db.none(this.__insert(items) + ' ON CONFLICT DO UPDATE')
  }

  async __insert (data) {
    return this.pgp.helpers.insert(data, this.model.getColumns(), this.model.getTable())
  }
}
