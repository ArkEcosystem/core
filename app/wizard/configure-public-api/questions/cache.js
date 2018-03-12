module.exports = [{
  type: 'confirm',
  name: 'enabled',
  message: 'Would you like to enable caching? (Recommended in Production)',
  initial: 'localhost'
}, {
  type: 'text',
  name: 'host',
  message: 'What is your host?',
  initial: 'localhost'
}, {
  type: 'number',
  name: 'expiresIn',
  message: 'When should the cache expire and be refreshed?',
  initial: 60000
}]
