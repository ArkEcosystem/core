module.exports = class Paginator {
  constructor (request, count, pager) {
    this.request = request
    this.count = count
    this.skip = pager.offset
    this.limit = pager.limit
  }

  meta () {
    return {
      cursor: {
        previous: this.previous(),
        current: this.skip,
        next: this.next(),
        count: this.limit
      },
      count: this.count
    }
  }

  next () {
    const next = this.skip + this.limit

    return (next > this.count) ? 0 : next
  }

  previous () {
    const previous = this.skip - this.limit

    return (previous <= 0) ? 0 : previous
  }
}
