module.exports = class Repository {
  /**
   * Create a new repository instance.
   * @param  {Object} db
   * @param  {Object} pgp
   */
  constructor (db, pgp) {
    this.db = db
    this.pgp = pgp
  }

  /**
   * Estimate the number of records in the table.
   * @return {Promise}
   */
  async estimate () {
    return this.db.one(`SELECT count_estimate('SELECT * FROM ${this.model.getTable()})`)
  }

  /**
   * Run a truncate statement on the table.
   * @return {Promise}
   */
  async truncate () {
    return this.db.none(`TRUNCATE ${this.model.getTable()} RESTART IDENTITY`)
  }

  /**
   * Create one or many new instances of the related models.
   * @param  {Array|Object} item
   * @return {Promise}
   */
  async create (item) {
    return this.db.none(this.__insert(item))
  }

  /**
   * Create or update one or many related records matching the attributes.
   * @param  {Array|Object} item
   * @return {Promise}
   */
  async updateOrCreate (item) {
    return this.db.none(this.__insert(item) + ' ON CONFLICT DO UPDATE')
  }

  /**
   * Generate an INSERT query for the given data.
   * @param  {Array|Object} data
   * @return {String}
   */
  __insert (data) {
    data = this.__transform(data)

    return this.db.$config.pgp.helpers.insert(
      data, this.model.getColumns(), this.model.getTable()
    )
  }

  /**
   * Transform the given data to match the database schema.
   * @param  {Array|Object} data
   * @return {String}
   */
  __transform (item) {
    let items = Array.isArray(item) ? item : [item]

    for (let i = 0; i < items.length; i++) {
      items[i] = this.model.transform(items[i])
    }

    return items.length === 1 ? items[0] : items
  }
}
