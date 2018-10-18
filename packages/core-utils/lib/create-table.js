'use strict'

const Table = require('cli-table3')

module.exports = (opts, data) => {
  const table = new Table(opts)

  for (const item of data) {
    table.push(item)
  }

  return table.toString()
}
