'use strict';

const Op = require('sequelize').Op

module.exports = (params, filters) => {
  let where = {}

  if (filters.hasOwnProperty('exact')) {
    for (const elem of filters['exact']) {
      if (params[elem]) {
        where[elem] = params[elem]
      }
    }
  }

  if (filters.hasOwnProperty('between')) {
    for (const elem of filters['between']) {
      if (!params[elem]) continue

      if (!params[elem].hasOwnProperty('from') && !params[elem].hasOwnProperty('to')) where[elem] = params[elem]

      if (params[elem].hasOwnProperty('from') || params[elem].hasOwnProperty('to')) {
        where[elem] = {}

        if (params[elem].hasOwnProperty('from')) where[elem][Op.gte] = params[elem].from
        if (params[elem].hasOwnProperty('to')) where[elem][Op.lte] = params[elem].to
      }
    }
  }

  if (filters.hasOwnProperty('wildcard')) {
    for (const elem of filters['wildcard']) {
      if (params[elem]) {
        where[elem] = { [Op.like]: `%${params[elem]}%` }
      }
    }
  }

  return where
}
