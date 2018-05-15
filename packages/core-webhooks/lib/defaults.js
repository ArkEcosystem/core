'use strict'

module.exports = {
  database: {
    uri: `sqlite:${process.env.ARK_PATH_DATA}/database/webhooks.sqlite`,
    dialect: 'sqlite',
    logging: false
  },
  redis: {
    host: process.env.ARK_REDIS_HOST || 'localhost',
    port: process.env.ARK_REDIS_PORT || 6379
  },
  events: [{
    name: 'forging.started',
    description: 'Emitted when the current delegate starts forging.'
  }, {
    name: 'forging.stopped',
    description: 'Emitted when the current delegate stops forging.'
  }, {
    name: 'forging.missing',
    description: 'Emitted when the current delegate is missing blocks.'
  }, {
    name: 'block.forged',
    description: 'Emitted when a blocks is forged.'
  }, {
    name: 'block.removed',
    description: 'Emitted when a blocks is removed.'
  }, {
    name: 'transaction.forged',
    description: 'Emitted when a transaction is forged.'
  }, {
    name: 'transaction.removed',
    description: 'Emitted when a transaction is removed.'
  }, {
    name: 'transaction.expired',
    description: 'Emitted when a transaction expired.'
  }, {
    name: 'vote.created',
    description: 'Emitted when a vote is created.'
  }, {
    name: 'vote.removed',
    description: 'Emitted when a vote is removed.'
  }, {
    name: 'peer.added',
    description: 'Emitted when a peer is added.'
  }, {
    name: 'peer.removed',
    description: 'Emitted when a peer is removed.'
  }, {
    name: 'peer.banned',
    description: 'Emitted when a peer is banned.'
  }]
}
