const url = require('url')

const config = {
  queryParams: {
    '1.0.0': { page: 'offset', perPage: 'limit' },
    '2.0.0': { page: 'page', perPage: 'perPage' }
  },
  defaults: { page: 1, perPage: 100 }
}

module.exports = class Paginator {
  mount (req, res, next) {
    this.req = req

    const version = req.version()
    const queryParams = config.queryParams[version]

    this.page = parseInt(this.req.query[queryParams.page]) || config.defaults.page
    this.perPage = parseInt(this.req.query[queryParams.perPage]) || config.defaults.perPage

    delete req.query[queryParams.page]
    delete req.query[queryParams.perPage]

    this.params = req.query

    if (!req.query.hasOwnProperty(queryParams.perPage)) {
      this.params['perPage'] = this.perPage
    }

    req.pagination = this

    next()
  }

  getPaginator () {
    return (this.req.version() === '1.0.0')
      ? { offset: +this.params.page, limit: +this.params.perPage }
      : { page: +this.params.page, perPage: +this.params.perPage }
  }

  getLinks (count) {
    let links = {}

    if (this.req.version() === '1.0.0') return links

    if (this.page !== config.defaults.page) {
      this.params.page = config.defaults.page
      links.first = this._buildFullUrl()

      this.params.page = this.page - 1
      links.prev = this._buildFullUrl()
    }

    if (count !== undefined && this.page * this.perPage < count) {
      this.params.page = count % this.perPage === 0 ? count / this.perPage : Math.floor(count / this.perPage + config.defaults.page)
      links.last = this._buildFullUrl()
    }

    if (count === undefined || this.page * this.perPage < count) {
      this.params.page = this.page + 1
      links.next = this._buildFullUrl()
    }

    return links
  }

  _buildFullUrl () {
    return url.format({
      protocol: this.req.isSecure() ? 'https' : 'http',
      host: this.req.headers.host,
      pathname: this.req.route.path,
      query: this.getPaginator()
    })
  }
}
