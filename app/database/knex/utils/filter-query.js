module.exports = (query, params, filters) => {
  let where = {}

  if (filters.hasOwnProperty('exact')) {
    for (const elem of filters['exact']) {
      if (params[elem]) {
        query.where(elem, params[elem])
      }
    }
  }

  if (filters.hasOwnProperty('between')) {
    for (const elem of filters['between']) {
      if (!params[elem] && !params[`${elem}From`] && !params[`${elem}To`]) continue

      if (!params[`${elem}From`] && !params[`${elem}To`]) {
        query.where(elem, params[elem])
      }

      if (params[`${elem}From`] || params[`${elem}To`]) {
        where[elem] = {}

        if (params[`${elem}From`]) {
          query.where(elem, '>=', params[`${elem}From`])
        }

        if (params[`${elem}To`]) {
          query.where(elem, '<=', params[`${elem}To`])
        }
      }
    }
  }

  if (filters.hasOwnProperty('wildcard')) {
    for (const elem of filters['wildcard']) {
      if (params[elem]) {
        query.where(elem, 'like', `%${params[elem]}%`)
      }
    }
  }

  return where
}
