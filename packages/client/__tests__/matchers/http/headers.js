'use strict'

module.exports = (actual, expected) => {
  // These headers should be added to the request
  const additional = ['API-Version', 'Nethash', 'Port', 'Version']

  return {
    message: () => {
      const actualHeaders = additional.reduce((all, header) => {
        if (header in additional) {
          all[header] = actual.data.headers[header]
        }
        return all
      }, {})

      return `Expected actual headers to match expected: ${JSON.stringify(actualHeaders)} vs. ${JSON.stringify(expected)}`
    },
    pass: additional.every(header => actual.data.headers[header] === expected[header])
  }
}
