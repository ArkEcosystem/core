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
      if (!params[elem] && !params[`${elem}From`] && !params[`${elem}To`]) continue

      if (!params[`${elem}From`] && !params[`${elem}To`]) where[elem] = params[elem]

      if (params[`${elem}From`] || params[`${elem}To`]) {
        where[elem] = {}

        if (params[`${elem}From`]) where[elem][Op.gte] = params[`${elem}From`]
        if (params[`${elem}To`]) where[elem][Op.lte] = params[`${elem}To`]
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
