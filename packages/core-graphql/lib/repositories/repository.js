'use strict'

const container = require('@arkecosystem/core-container')
const database = container.resolvePlugin('database')

module.exports = class Repository {
  constructor () {
    this.cache = database.getCache()
    this.model = this.getModel()
    this.query = this.model.query()
  }

  async _find (query) {
    return database.query.oneOrNone(query.toQuery())
  }

  async _findMany (query) {
    return database.query.manyOrNone(query.toQuery())
  }

  async _findManyWithCount (selectQuery, countQuery, { limit, offset, orderBy }) {
    const { count } = await this._find(countQuery)

    selectQuery
      .order(this.query[orderBy[0]][orderBy[1]])
      .offset(offset)
      .limit(limit)

    limit = 100
    offset = 0
    const rows = await this._findMany(selectQuery)
    return {
      rows: rows,
      count: +count
    }
  }

  _makeCountQuery () {
    return this.query
      .select('count(*) AS count')
      .from(this.query)
  }

  _makeEstimateQuery () {
    return this.query
      .select('count(*) AS count')
      .from(`${this.model.getTable()} TABLESAMPLE SYSTEM (100)`)
  }

  _formatConditions (parameters) {
    const columns = this.model.getColumnSet().columns.map(column => ({
      name: column.name,
      prop: column.prop || column.name
    }))

    const columnNames = columns.map(column => column.name)
    const columnProps = columns.map(column => column.prop)

    const filter = args => args.filter(arg => {
      return columnNames.includes(arg) || columnProps.includes(arg)
    })

    return filter(Object.keys(parameters)).reduce((items, item) => {
      const columnName = columns.find(column => (column.prop === item)).name

      items[columnName] = parameters[item]

      return items
    }, {})
  }
}
