module.exports = class Paginator {
  constructor (count, pager) {
    this.count = count
    this.cursor = pager.offset
    this.limit = pager.limit
  }

  meta () {
    return {
      cursor: {
        previous: this.previous(),
        current: this.cursor,
        next: this.next(),
        count: this.limit
      },
      count: this.count
    }
  }

  next () {
    const next = this.cursor + this.limit

    return (next > this.count) ? 0 : next
  }

  previous () {
    const previous = this.cursor - this.limit

    return (previous <= 0) ? 0 : previous
  }
}
