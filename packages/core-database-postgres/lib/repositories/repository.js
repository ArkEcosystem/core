module.exports = class Repository {
  /**
   * Create a new repository instance.
   * @param  {Object} db
   */
  constructor (db) {
    this.db = db
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
    return this.db.none(this.__insertQuery(item))
  }

  /**
   * Create or update one or many related records matching the attributes.
   * @param  {Array|Object} item
   * @return {Promise}
   */
  async updateOrCreate (item) {
    return this.db.none(this.__upsertQuery(item))
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
   * Generate an "INSERT OR UPDATE" query for the given data.
   * @param  {Array|Object} data
   * @return {String}
   */
  __upsertQuery(data) {
    const conflictColumns = this.model.getColumnSet()
      .columns.map(column => column.name).join(',')

    return this.__insertQuery(data)
      + ` ON CONFLICT(${conflictColumns}) DO UPDATE SET `
      + this.model.getColumnSet().assignColumns()
  }

  /**
   * Get the PGP instance of the database connection.
   * @return {Object}
   */
  get pgp () {
    return this.db.$config.pgp
  }
}
