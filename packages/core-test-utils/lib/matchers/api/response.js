'use strict'

const toBeSuccessfulResponse = (actual, expected) => ({
  message: () => `Expected ${JSON.stringify({ data: actual.data, status: actual.status, headers: actual.headers })} to be a successful response`,
  pass: actual.status === 200 && typeof actual.data === 'object'
})

module.exports = {
    toBeSuccessfulResponse
}
