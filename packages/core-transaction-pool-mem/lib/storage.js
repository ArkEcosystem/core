'use strict'

const logger = require('@arkecosystem/core-container').resolvePlugin('logger')

/**
 * A permanent storage (on-disk), supporting some basic functionalities required
 * by the transaction pool.
 */
class Storage {
  /**
   * Construct the storage.
   */
  constructor () {
    this.file = 'transaction_pool.sqlite'
    this.table = 'pool'

    const BetterSqlite3 = require('better-sqlite3')
    this.db = new BetterSqlite3(this.file)

    const newMode = this.db.pragma('journal_mode=WAL', true)
    if (newMode.toUpperCase() !== 'WAL') {
      logger.warn(
        'Transaction pool: could not switch SQLite journal mode to WAL. ' +
        `The journal mode is '${newMode}'. Expect reduced performance.`)
    }

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ${this.table} (
        "sequence" INTEGER PRIMARY KEY AUTOINCREMENT,
        "id" VARCHAR(64) UNIQUE,
        "senderPublicKey" VARCHAR(66) NOT NULL,
        "serialized" TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS "pool_sender" ON pool ("senderPublicKey");
    `)
  }

  /**
   * Close the storage.
   */
  close () {
    this.db.close()
    this.db = null
  }

  /**
   * Add a bunch of new entries to the storage.
   * @param {Array of Transaction} data new entries to be added
   */
  bulkAdd (data) {
    const columns = [ 'id', 'senderPublicKey', 'serialized' ]
    const columnsSql = columns.join(', ')
    const valuesSql = columns.map(c => ':' + c).join(', ')

    const insertStatement = this.db.prepare(
      `INSERT INTO ${this.table} (${columnsSql}) VALUES (${valuesSql});`)

    this.db.prepare('BEGIN;').run()

    data.map(d => {
      const params = {}
      columns.map(c => { params[c] = d[c] })
      insertStatement.run(params)
    })

    this.db.prepare('COMMIT;').run()
  }

  /**
   * Remove a bunch of entries, given their ids.
   * @param {Array of String} ids of the elements to be removed
   */
  bulkRemoveById (ids) {
    const deleteStatement = this.db.prepare(
      `DELETE FROM ${this.table} WHERE id = :id;`)

    this.db.prepare('BEGIN;').run()

    ids.map(id => deleteStatement.run({ id: id }))

    this.db.prepare('COMMIT;').run()
  }

  /**
   * Load all entries in the order they were inserted.
   * @return {Array of String} representing serialized entries
   */
  loadAllInInsertionOrder () {
    return this.db.prepare(`SELECT * FROM ${this.table} ORDER BY sequence;`).all()
  }

  /**
   * Delete all entries.
   */
  deleteAll () {
    this.db.exec(`DELETE FROM ${this.table};`)
  }
}

module.exports = Storage
