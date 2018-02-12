module.exports = {
  enabled: false,
  events: [{
    name: 'block.created',
    description: 'Fired when a new block is created. (any Block, e.g. during rebuilds)'
  }, {
    name: 'block.forged',
    description: 'Fired when a new block is forged.'
  }, {
    name: 'blocks.missing',
    description: 'Fired when blocks are missing.'
  }, {
    name: 'blocks.stopped',
    description: 'Fired when blocks are not produced.'
  }, {
    name: 'transaction.created',
    description: 'Fired when a new transaction is created.'
  }, {
    name: 'vote.created',
    description: 'Fired when a vote is created.'
  }, {
    name: 'vote.removed',
    description: 'Fired when a vote is removed.'
  }]
}
