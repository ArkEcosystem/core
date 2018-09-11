module.exports = class Repository {
  /**
   * Create a new repository instance.
   * @param  {Object} db
   * @param  {Object} pgp
   */
  constructor (db, pgp) {
    this.db = db
    this.pgp = pgp
    this.model = this.getModel()
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
   * Create one or many instances of the related models.
   * @param  {Array|Object} item
   * @return {Promise}
   */
  async create (item) {
    return this.db.none(this.__insertQuery(item))
  }

  /**
   * Update one or many instances of the related models.
   * @param  {Array|Object} item
   * @return {Promise}
   */
  async update (item) {
    return this.db.none(this.__updateQuery(item))
  }

  /**
   * Get the model related to this repository.
   * @return {Object}
   */
  getModel () {
    throw new Error('Method [getModel] not implemented!')
  }

  /**
   * Generate an "INSERT" query for the given data.
   * @param  {Array|Object} data
   * @return {String}
   */
  __insertQuery (data) {
    return this.pgp.helpers.insert(data, this.model.getColumnSet())
  }

  /**
   * Generate an "UPDATE" query for the given data.
   * @param  {Array|Object} data
   * @return {String}
   */
  __updateQuery (data) {
    return this.pgp.helpers.update(data, this.model.getColumnSet())
  }
}
