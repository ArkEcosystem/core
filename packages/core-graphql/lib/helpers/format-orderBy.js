'use strict';

module.exports = (orderByInput, defaultInput) => {
  let order = []

  if (orderByInput) {
    order.push([orderByInput.field, orderByInput.direction])
  } else if (defaultInput) {
    order.push(defaultInput)
  }

  return order
}
