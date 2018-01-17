module.exports = class Bucket {
  constructor (options) {
    this.tokens = this.capacity = options.capacity
    this.fillRate = options.fillRate
    this.time = Date.now()
  }

  consume (tokens) {
    if (this.fillRate === 0 && this.capacity === 0) {
      return true
    }

    if (tokens <= this.fill()) {
      this.tokens -= tokens

      return true
    }

    return false
  }

  fill () {
    let now = Date.now()

    // reset account for clock drift (like DST)
    if (now < this.time) {
      this.time = now - 1000
    }

    if (this.tokens < this.capacity) {
      let delta = this.fillRate * ((now - this.time) / 1000)

      this.tokens = Math.min(this.capacity, this.tokens + delta)
    }

    this.time = now

    return this.tokens
  }
}
