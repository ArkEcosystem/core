const isEqual = require('lodash/isEqual')
const sortBy = require('lodash/sortBy')

function isValidPeer(peer) {
  const allowedKeys = sortBy(['ip', 'port'])
  const actualKeys = Object.keys(peer).filter(key => allowedKeys.includes(key))

  return isEqual(sortBy(actualKeys), allowedKeys)
}

const toBeValidPeer = (actual, expected) => ({
  message: () => `Expected ${JSON.stringify(actual)} to be a valid peer`,
  pass: isValidPeer(actual),
})

const toBeValidArrayOfPeers = (actual, expected) => {
  const message = () =>
    `Expected ${JSON.stringify(actual)} to be a valid array of peers`

  if (!Array.isArray(actual)) {
    return { message, pass: false }
  }

  actual.forEach(peer => {
    if (!isValidPeer(peer)) {
      return { message, pass: false }
    }
  })

  return { message, pass: true }
}

expect.extend({
  toBeValidPeer,
  toBeValidArrayOfPeers,
})
