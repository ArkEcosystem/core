'use strict'

module.exports = {
  enabled: false,
  database: {
    dialect: 'sqlite',
    storage: `${process.env.ARK_PATH_DATA}/database/webhooks.sqlite`,
    logging: false
  },
  redis: {
    host: process.env.ARK_REDIS_HOST || 'localhost',
    port: process.env.ARK_REDIS_PORT || 6379
  },
  events: [{
    name: 'block.applied',
    description: 'n/a'
  }, {
    name: 'block.forged',
    description: 'n/a'
  }, {
    name: 'block.reverted',
    description: 'n/a'
  }, {
    name: 'delegate.registered',
    description: 'n/a'
  }, {
    name: 'delegate.resigned',
    description: 'n/a'
  }, {
    name: 'forger.failed',
    description: 'n/a'
  }, {
    name: 'forger.missing',
    description: 'n/a'
  }, {
    name: 'forger.started',
    description: 'n/a'
  }, {
    name: 'peer.added',
    description: 'n/a'
  }, {
    name: 'peer.removed',
    description: 'n/a'
  }, {
    name: 'transaction.applied',
    description: 'n/a'
  }, {
    name: 'transaction.expired',
    description: 'n/a'
  }, {
    name: 'transaction.forged',
    description: 'n/a'
  }, {
    name: 'transaction.reverted',
    description: 'n/a'
  }, {
    name: 'wallet.vote',
    description: 'n/a'
  }, {
    name: 'wallet.unvote',
    description: 'n/a'
  }]
}
