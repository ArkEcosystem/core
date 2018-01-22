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
        current: this.current(),
        next: this.next(),
        count: this.limit
      },
      count: this.count
    }
  }

  current () {
    const current = this.cursor

    return (current === 0) ? null : current
  }

  next () {
    const next = this.cursor + this.limit

    return (next >= this.count) ? null : next
  }

  previous () {
    const previous = this.cursor - this.limit

    return (previous <= 0) ? null : previous
  }
}
