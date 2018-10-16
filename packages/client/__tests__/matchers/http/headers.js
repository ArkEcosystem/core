'use strict'

/**
 * Check that the request configuration includes some headers with the expected
 * values. The assertion is case insensitive.
 */
module.exports = (actual, expected) => {
  const requestNormalizedHeaders = Object.keys(actual.headers).map(header => header.toLowerCase())

  let found = 0
  for (const header in expected) {
    const normalizedHeader = header.toLowerCase()

    if (requestNormalizedHeaders.indexOf(normalizedHeader) !== -1) {
      const expectedValue = expected[header]

      if (expectedValue === actual.headers[header]) {
        found++
      } else {
        break
      }
    }
  }

  return {
    message: () => `Expected actual headers to include and match expected: ${JSON.stringify(actual.headers)} vs. ${JSON.stringify(expected)}`,
    pass: found === Object.keys(expected).length
  }
}
