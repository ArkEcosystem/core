'use strict';

module.exports = (orderByInput, defaultInput) => {
  let order

  if (orderByInput) {
    order = `${orderByInput.field}:${orderByInput.direction}`
  }

  return order || defaultInput
}
