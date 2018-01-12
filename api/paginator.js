const querystring = require('querystring')

class Paginator {
  constructor(request, count, pager) {
    this.request = request
    this.count = count
    this.page = pager.page
    this.perPage = pager.perPage
    this.totalPages = Math.round(count / pager.perPage)
  }

  meta() {
    return {
      page: this.page,
      per_page: this.perPage,
      total: this.totalPages,
    }
  }

  links() {
    return {
      first_page_url: this.firstPageUrl(),
      last_page_url: this.lastPageUrl(),
      next_page_url: this.nextPageUrl(),
      prev_page_url: this.previousPageUrl(),
    }
  }

  firstPageUrl() {
    return this.toFullUrl({
      page: 1
    })
  }

  lastPageUrl() {
    return this.toFullUrl({
      page: this.totalPages
    })
  }

  nextPageUrl() {
    let query = {}

    if (this.page >= this.totalPages) {
      query.page = this.totalPages
    } else {
      query.page = this.page + 1
    }

    return this.toFullUrl(query)
  }

  previousPageUrl() {
    let query = {}

    if (this.page <= 1) {
      query.page = 1
    } else {
      query.page = this.page - 1
    }

    return this.toFullUrl(query)
  }

  toFullUrl(query) {
    if (this.perPage > 0) {
      query.perPage = this.perPage
    }

    return this.request.path() + '?' + querystring.stringify(query)
  }
}

module.exports = Paginator
