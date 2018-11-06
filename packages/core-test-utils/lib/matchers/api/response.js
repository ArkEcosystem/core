'use strict'

const toBeSuccessfulResponse = (actual, expected) => ({
  message: () => `Expected ${JSON.stringify({ data: actual.data, status: actual.status, headers: actual.headers })} to be a successful response`,
  pass: actual.status === 200 && typeof actual.data === 'object'
})

const toBePaginated = (actual, expected) => ({
  message: () => `Expected ${JSON.stringify({ data: actual.data, status: actual.status, headers: actual.headers })} to be a paginated response`,
  pass: actual.data.meta &&
    ['pageCount', 'totalCount', 'next', 'previous', 'self', 'first', 'last'].every(property => Object.keys(actual.data.meta).includes(property))
})

expect.extend({
  toBeSuccessfulResponse,
  toBePaginated
})
