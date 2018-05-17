'use strict';

module.exports = (parameter, defaultValue) => {
  let order

  if (parameter) {
    order = `${parameter.field}:${parameter.direction}`
  }

  return order || defaultValue
}
