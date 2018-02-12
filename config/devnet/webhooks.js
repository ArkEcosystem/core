module.exports = {
  enabled: false,
  events: [{
    name: 'block:created',
    description: 'Fired when a new block is created.'
  }, {
    name: 'transaction:created',
    description: 'Fired when a new transaction is created.'
  }]
}
