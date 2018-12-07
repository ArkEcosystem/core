const snakeCase = require('lodash/snakeCase')
const app = require('@arkecosystem/core-container')

const database = app.resolvePlugin('database')

module.exports = class Repository {
  constructor() {
    this.cache = database.getCache()
    this.model = this.getModel()
    this.query = this.model.query()

    this.__mapColumns()
  }

  async _find(query) {
    return database.query.oneOrNone(query.toQuery())
  }

  async _findMany(query) {
    return database.query.manyOrNone(query.toQuery())
  }

  async _findManyWithCount(
    selectQuery,
    { limit, offset, orderBy },
  ) {
    if (this.columns.includes(orderBy[0])) {
      selectQuery.order(this.query[snakeCase(orderBy[0])][orderBy[1]])
    }

    const offsetIsSet = Number.isInteger(offset) && offset > 0
    const limitIsSet = Number.isInteger(limit)

    if (!offsetIsSet && !limitIsSet) {
      const rows = await this._findMany(selectQuery)

      return { rows, count: rows.length }
    }

    selectQuery.offset(offset).limit(limit)

    const rows = await this._findMany(selectQuery)

    if (rows.length < limit) {
      return { rows, count: offset + rows.length }
    }

    // Get the last rows=... from something that looks like (1 column, few rows):
    //
    //                            QUERY PLAN
    // ------------------------------------------------------------------
    //  Limit  (cost=15.34..15.59 rows=100 width=622)
    //    ->  Sort  (cost=15.34..15.64 rows=120 width=622)
    //          Sort Key: "timestamp" DESC
    //          ->  Seq Scan on transactions  (cost=0.00..11.20 rows=120 width=622)

    let count = 0
    const explainSql = `EXPLAIN ${selectQuery.toString()}`
    for (const row of await database.query.manyOrNone(explainSql)) {
      const line = Object.values(row)[0]
      const match = line.match(/rows=([0-9]+)/)
      if (match !== null) {
        count = Number(match[1])
      }
    }

    return { rows, count: Math.max(count, rows.length) }
  }

  _formatConditions(parameters) {
    const columns = this.model.getColumnSet().columns.map(column => ({
      name: column.name,
      prop: column.prop || column.name,
    }))

    return Object.keys(parameters)
      .filter(arg => this.columns.includes(arg))
      .reduce((items, item) => {
        const column = columns.find(
          value => value.name === item || value.prop === item,
        )

        column ? (items[column.name] = parameters[item]) : delete items[item]

        return items
      }, {})
  }

  __mapColumns() {
    this.columns = []

    for (const column of this.model.getColumnSet().columns) {
      this.columns.push(column.name)

      if (column.prop) {
        this.columns.push(column.prop)
      }
    }
  }
}
