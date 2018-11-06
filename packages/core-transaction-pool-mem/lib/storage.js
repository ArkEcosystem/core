'use strict'

const BetterSqlite3 = require('better-sqlite3')
const MemPoolTransaction = require('./mem-pool-transaction')
const fs = require('fs-extra')
const { Transaction } = require('@arkecosystem/crypto').models

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
        "sequence" INTEGER PRIMARY KEY,
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
   * @param {Array of MemPoolTransaction} data new entries to be added
   */
  bulkAdd (data) {
    if (data.length === 0) {
      return
    }

    const insertStatement = this.db.prepare(
      `INSERT INTO ${this.table} ` +
      '(sequence, id, serialized) VALUES ' +
      '(:sequence, :id, :serialized);')

    this.db.prepare('BEGIN;').run()

    data.forEach(d => insertStatement.run({
      sequence: d.sequence,
      id: d.transaction.id,
      serialized: Buffer.from(d.transaction.serialized, 'hex')
    }))

    this.db.prepare('COMMIT;').run()
  }

  /**
   * Remove a bunch of entries, given their ids.
   * @param {Array of String} ids ids of the elements to be removed
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
   * Load all entries.
   * @return {Array of MemPoolTransaction}
   */
  loadAll () {
    const rows = this.db.prepare(
      `SELECT sequence, lower(HEX(serialized)) AS serialized FROM ${this.table};`).all()
    return rows.map(r =>
      new MemPoolTransaction(new Transaction(r.serialized), r.sequence))
  }

  /**
   * Delete all entries.
   */
  deleteAll () {
    this.db.exec(`DELETE FROM ${this.table};`)
  }
}

module.exports = Storage
