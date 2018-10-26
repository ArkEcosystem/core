'use strict'

const container = require('@arkecosystem/core-container')
const database = container.resolvePlugin('database')

module.exports = class Repository {
  constructor () {
    this.cache = database.getCache()
    this.model = this.getModel()
    this.query = this.model.query()

    this.__mapColumns()
  }

  async _find (query) {
    return database.query.oneOrNone(query.toQuery())
  }

  async _findMany (query) {
    return database.query.manyOrNone(query.toQuery())
  }

  async _findManyWithCount (selectQuery, countQuery, { limit, offset, orderBy }) {
    const { count } = await this._find(countQuery)

    if (this.columns.includes(orderBy[0])) {
      selectQuery.order(this.query[orderBy[0]][orderBy[1]])
    }

    selectQuery.offset(offset).limit(limit)

    return {
      rows: await this._findMany(selectQuery),
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

  __mapColumns () {
    this.columns = []

    for (const column of this.model.getColumnSet().columns) {
      this.columns.push(column.name)

      if (column.prop) {
        this.columns.push(column.prop)
      }
    }
  }
}
