const url = require('url')

module.exports = class Paginator {
  constructor (request, count, pager) {
    this.request = request
    this.count = count
    this.page = pager.offset
    this.limit = pager.limit
    this.totalPages = Math.ceil(count / this.limit)
  }

  meta () {
    return { count: this.count }
  }

  links () {
    return {
      self: this.self(),
      first: this.first(),
      prev: this.prev(),
      next: this.next(),
      last: this.last()
    }
  }

  self () {
    return this.fullUrl(this.page)
  }

  first () {
    return this.fullUrl(1)
  }

  prev () {
    const previous = this.page - 1

    return this.fullUrl((previous <= 0) ? 1 : previous)
  }

  next () {
    const next = this.page + 1

    return this.fullUrl((next >= this.count) ? this.totalPages : next)
  }

  last () {
    return this.fullUrl(this.totalPages)
  }

  fullUrl (page) {
    return url.format({
      protocol: this.request.isSecure() ? 'https' : 'http',
      host: this.request.headers.host,
      pathname: this.request.route.path,
      query: { page: page, size: this.limit }
    })
  }
}
