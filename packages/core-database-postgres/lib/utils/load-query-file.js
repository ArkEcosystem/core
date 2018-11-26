const QueryFile = require('pg-promise').QueryFile
const path = require('path')

const app = require('@arkecosystem/core-container')

const logger = app.resolvePlugin('logger')

module.exports = (directory, file) => {
  const fullPath = path.join(directory, file)

  const options = {
    minify: true,
    params: {
      schema: 'public',
    },
  }

  const query = new QueryFile(fullPath, options)

  if (query.error) {
    logger.error(query.error)
  }

  return query
}
