'use strict'

const container = require('@arkecosystem/core-container')
const database = container.resolvePlugin('database')

module.exports = class Repository {
  constructor () {
    this.cache = database.getCache()
    this.model = this.getModel()
    this.query = this.model.query()
  }

  async __find (query) {
    return database.query.oneOrNone(query.toQuery())
  }

  async __findMany (query) {
    return database.query.manyOrNone(query.toQuery())
  }

  async __findManyWithCount (query, { limit, offset, orderBy }) {
    // FIX: estimate query issue with WHERE conditions
    const count = 0 // await this.__estimate(query)

    query
      .order(this.query[orderBy[0]][orderBy[1]])
      .offset(offset)
      .limit(limit)

    return {
      rows: await this.__findMany(query),
      count
    }
  }

  async __estimate (query) {
    const { countEstimate } = await database.query.one(`SELECT count_estimate ('${query.toQuery().text}');`)

    return countEstimate
  }

  __formatConditions (params) {
    const columns = database.models.transaction.getColumnSet().columns.map(column => ({
      name: column.name,
      prop: column.prop || column.name
    }))

    const columnNames = columns.map(column => column.name)
    const columnProps = columns.map(column => column.prop)

    const filter = args => args.filter(arg => {
      return columnNames.includes(arg) || columnProps.includes(arg)
    })

    const conditions = filter(Object.keys(params)).reduce((items, item) => {
      const columnName = columns.find(column => (column.prop === item)).name

      items[columnName] = params[item]

      return items
    }, {})

    return Object.entries(conditions)
  }
}
