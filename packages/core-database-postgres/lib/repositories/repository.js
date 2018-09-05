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
   * Run a truncate statement on the table.
   * @return {Promise}
   */
  async truncate () {
    return this.db.none(`TRUNCATE ${this.model.getTable()} RESTART IDENTITY`)
  }

  /**
   * Create a new instance of the related model.
   * @param  {Object} item
   * @return {Promise}
   */
  async create (item) {
    item = this.model.transform(item)

    return this.db.none(this.__insert(item))
  }

  /**
   * Create many  new instances of the related models.
   * @param  {Array} items
   * @return {Promise}
   */
  async createMany (items) {
    for (let item of items) {
      item = this.model.transform(item)
    }

    return this.db.none(this.__insert(items))
  }

  /**
   * Create or update a related record matching the attributes.
   * @param  {Object} item
   * @return {Promise}
   */
  async updateOrCreate (item) {
    item = this.model.transform(item)

    return this.db.none(this.__insert(item) + ' ON CONFLICT DO UPDATE')
  }

  /**
   * Create or update many related records matching the attributes.
   * @param  {Array} items
   * @return {Promise}
   */
  async updateOrCreateMany (items) {
    for (let item of items) {
      item = this.model.transform(item)
    }

    return this.db.none(this.__insert(items) + ' ON CONFLICT DO UPDATE')
  }

  /**
   * Generate an INSERT query for the given data.
   * @param  {Array|Object} data
   * @return {String}
   */
  async __insert (data) {
    return this.pgp.helpers.insert(data, this.model.getColumns(), this.model.getTable())
  }
}
