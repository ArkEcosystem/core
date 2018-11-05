const QueryFile = require('pg-promise').QueryFile
const path = require('path')

const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')

module.exports = {
  loadQueryFile: (directory, file) => {
    const fullPath = path.join(directory, file)

    const options = {
      minify: true,
      params: {
        schema: 'public'
      }
    }

    const query = new QueryFile(fullPath, options)

    if (query.error) {
      logger.error(query.error)
    }

    return query
  },

  rawQuery: (pgp, queryFile, parameters) => {
    return pgp.as.format(queryFile, parameters)
  }
}
