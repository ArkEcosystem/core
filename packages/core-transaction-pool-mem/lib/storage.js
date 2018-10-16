'use strict'

const fs = require('fs-extra')
const BetterSqlite3 = require('better-sqlite3')

/**
 * A permanent storage (on-disk), supporting some basic functionalities required
 * by the transaction pool.
 */
class Storage {
  /**
   * Construct the storage.
   * @param {String} file
   */
  constructor (file) {
    this.table = 'pool'

    fs.ensureFileSync(file)

    this.db = new BetterSqlite3(file)

    this.db.exec(`
      PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS ${this.table} (
        "sequence" INTEGER PRIMARY KEY AUTOINCREMENT,
        "id" VARCHAR(64) UNIQUE,
        "serialized" BLOB NOT NULL
      );
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
    if (data.length === 0) {
      return
    }

    const insertStatement = this.db.prepare(
      `INSERT INTO ${this.table} (id, serialized) VALUES (:id, :serialized);`)

    this.db.prepare('BEGIN;').run()

    data.forEach(d => insertStatement.run({
      id: d.id,
      serialized: Buffer.from(d.serialized, 'hex')
    }))

    this.db.prepare('COMMIT;').run()
  }

  /**
   * Remove a bunch of entries, given their ids.
   * @param {Array of String} ids of the elements to be removed
   */
  bulkRemoveById (ids) {
    if (ids.length === 0) {
      return
    }

    const deleteStatement = this.db.prepare(
      `DELETE FROM ${this.table} WHERE id = :id;`)

    this.db.prepare('BEGIN;').run()

    ids.forEach(id => deleteStatement.run({ id: id }))

    this.db.prepare('COMMIT;').run()
  }

  /**
   * Load all entries in the order they were inserted.
   * @return {Array of String} representing serialized entries
   */
  loadAllInInsertionOrder () {
    const rows = this.db.prepare(
      `SELECT HEX(serialized) AS serializedHex FROM ${this.table} ORDER BY sequence;`).all()
    return rows.map(r => r.serializedHex)
  }

  /**
   * Delete all entries.
   */
  deleteAll () {
    this.db.exec(`DELETE FROM ${this.table};`)
  }
}

module.exports = Storage
