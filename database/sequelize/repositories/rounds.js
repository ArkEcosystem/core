class RoundsRepository {
  constructor(db) {
    this.db = db
  }

  bulkCreate(data) {
    return this.db.roundsTable.bulkCreate(data)
  }
}

module.exports = RoundsRepository
