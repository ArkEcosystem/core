const url = require('url')

const config = {
  '1.0.0': {
    parameters: { page: 'offset', perPage: 'limit' },
    defaults: { page: 0, perPage: 100 }
  },
  '2.0.0': {
    parameters: { page: 'page', perPage: 'perPage' },
    defaults: { page: 1, perPage: 100 }
  }
}

module.exports = class Paginator {
  mount (req, res, next) {
    this.request = req

    this.config = config[this._version()]

    this.page = parseInt(this.request.query[this.config.parameters.page]) || this.config.defaults.page
    this.perPage = parseInt(this.request.query[this.config.parameters.perPage]) || this.config.defaults.perPage

    delete req.query[this.config.parameters.page]
    delete req.query[this.config.parameters.perPage]

    this.params = req.query

    if (!req.query.hasOwnProperty(this.config.parameters.perPage)) {
      this.params[this.config.parameters.perPage] = this.perPage
    }

    req.paginator = this

    next()
  }

  pointer () {
    return (this._version() === '1.0.0')
      ? { offset: +this.page, limit: +this.perPage }
      : { page: +this.page, perPage: +this.perPage }
  }

  links (count) {
    let links = {}

    if (this._version() === '1.0.0') return links

    if (this.page !== this.config.defaults.page) {
      this.params.page = this.config.defaults.page
      links.first = this._buildFullUrl()

      this.params.page = this.page - 1
      links.prev = this._buildFullUrl()
    }

    if (count !== undefined && this.page * this.perPage < count) {
      this.params.page = count % this.perPage === 0 ? count / this.perPage : Math.floor(count / this.perPage + this.config.defaults.page)
      links.last = this._buildFullUrl()
    }

    if (count === undefined || this.page * this.perPage < count) {
      this.params.page = this.page + 1
      links.next = this._buildFullUrl()
    }

    return links
  }

  _buildFullUrl () {
    const pointer = (this._version() === '1.0.0')
      ? { offset: +this.params.page, limit: +this.params.limit }
      : { page: +this.params.page, perPage: +this.params.perPage }

    return url.format({
      protocol: this.request.isSecure() ? 'https' : 'http',
      host: this.request.headers.host,
      pathname: this.request.route.path,
      query: pointer
    })
  }

  _version () {
    return this.request.version()
  }
}
