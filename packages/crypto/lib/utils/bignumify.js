'use strict'

const Bignum = require('./bignum')

module.exports = (object, keys) => {
  for (const key of keys) {
    if(!(object[key] instanceof Bignum)) {
      object[key] = new Bignum(object[key])
    }
  }
}
