'use strict'

const blocks = require('./handlers/blocks')
const delegates = require('./handlers/delegates')
const loader = require('./handlers/loader')
const peers = require('./handlers/peers')
const signatures = require('./handlers/signatures')
const transactions = require('./handlers/transactions')
const accounts = require('./handlers/accounts')

/**
 * Register the v1 routes.
 * @param  {Hapi.Server} server
 * @param  {Object} options
 * @return {void}
 */
const register = async (server, options) => {
  server.route([
    { method: 'GET',
      path: '/accounts/getAllAccounts',
      ...accounts.index,
      config: {
        tags: ['api', 'accounts']
      }},
    { method: 'GET',
      path: '/accounts',
      ...accounts.show,
      config: {
        tags: ['api', 'accounts']
      }},
    { method: 'GET',
      path: '/accounts/',
      ...accounts.show,
      config: {
        tags: ['api', 'accounts']
      }}, // v1 inconsistency
    { method: 'GET',
      path: '/accounts/getBalance',
      ...accounts.balance,
      config: {
        tags: ['api', 'accounts']
      }},
    { method: 'GET',
      path: '/accounts/getPublicKey',
      ...accounts.publicKey,
      config: {
        tags: ['api', 'accounts']
      }},
    { method: 'GET',
      path: '/accounts/delegates/fee',
      ...accounts.fee,
      config: {
        tags: ['api', 'accounts']
      }},
    { method: 'GET',
      path: '/accounts/delegates',
      ...accounts.delegates,
      config: {
        tags: ['api', 'accounts']
      }},
    { method: 'GET',
      path: '/accounts/delegates/',
      ...accounts.delegates,
      config: {
        tags: ['api', 'accounts']
      }}, // v1 inconsistency
    { method: 'GET',
      path: '/accounts/top',
      ...accounts.top,
      config: {
        tags: ['api', 'accounts']
      }},
    { method: 'GET',
      path: '/accounts/count',
      ...accounts.count,
      config: {
        tags: ['api', 'accounts']
      }},

    { method: 'GET',
      path: '/blocks',
      ...blocks.index,
      config: {
        tags: ['api', 'blocks']
      }},
    { method: 'GET',
      path: '/blocks/get',
      ...blocks.show,
      config: {
        tags: ['api', 'blocks']
      }},
    { method: 'GET',
      path: '/blocks/getEpoch',
      ...blocks.epoch,
      config: {
        tags: ['api', 'blocks']
      }},
    { method: 'GET',
      path: '/blocks/getHeight',
      ...blocks.height,
      config: {
        tags: ['api', 'blocks']
      }},
    { method: 'GET',
      path: '/blocks/getheight',
      ...blocks.height,
      config: {
        tags: ['api', 'blocks']
      }}, // desktop wallet inconsistency
    { method: 'GET',
      path: '/blocks/getNethash',
      ...blocks.nethash,
      config: {
        tags: ['api', 'blocks']
      }},
    { method: 'GET',
      path: '/blocks/getFee',
      ...blocks.fee,
      config: {
        tags: ['api', 'blocks']
      }},
    { method: 'GET',
      path: '/blocks/getFees',
      ...blocks.fees,
      config: {
        tags: ['api', 'blocks']
      }},
    { method: 'GET',
      path: '/blocks/getfees',
      ...blocks.fees,
      config: {
        tags: ['api', 'blocks']
      }}, // desktop wallet inconsistency
    { method: 'GET',
      path: '/blocks/getMilestone',
      ...blocks.milestone,
      config: {
        tags: ['api', 'blocks']
      }},
    { method: 'GET',
      path: '/blocks/getReward',
      ...blocks.reward,
      config: {
        tags: ['api', 'blocks']
      }},
    { method: 'GET',
      path: '/blocks/getSupply',
      ...blocks.supply,
      config: {
        tags: ['api', 'blocks']
      }},
    { method: 'GET',
      path: '/blocks/getStatus',
      ...blocks.status,
      config: {
        tags: ['api', 'blocks']
      }},

    { method: 'GET',
      path: '/delegates',
      ...delegates.index,
      config: {
        tags: ['api', 'delegates']
      }},
    { method: 'GET',
      path: '/delegates/get',
      ...delegates.show,
      config: {
        tags: ['api', 'delegates']
      }},
    { method: 'GET',
      path: '/delegates/get/',
      ...delegates.show,
      config: {
        tags: ['api', 'delegates']
      }}, // v1 inconsistency
    { method: 'GET',
      path: '/delegates/count',
      ...delegates.count,
      config: {
        tags: ['api', 'delegates']
      }},
    { method: 'GET',
      path: '/delegates/search',
      ...delegates.search,
      config: {
        tags: ['api', 'delegates']
      }},
    { method: 'GET',
      path: '/delegates/voters',
      ...delegates.voters,
      config: {
        tags: ['api', 'delegates']
      } },
    { method: 'GET',
      path: '/delegates/fee',
      ...delegates.fee,
      config: {
        tags: ['api', 'delegates']
      }},
    { method: 'GET',
      path: '/delegates/forging/getForgedByAccount',
      ...delegates.forged,
      config: {
        tags: ['api', 'delegates']
      }},
    { method: 'GET',
      path: '/delegates/getNextForgers',
      ...delegates.nextForgers,
      config: {
        tags: ['api', 'delegates']
      } },

    { method: 'GET',
      path: '/loader/status',
      ...loader.status,
      config: {
        tags: ['api', 'delegates']
      }},
    { method: 'GET',
      path: '/loader/status/sync',
      ...loader.syncing,
      config: {
        tags: ['api', 'loader']
      }},
    { method: 'GET',
      path: '/loader/autoconfigure',
      ...loader.autoconfigure,
      config: {
        tags: ['api', 'loader']
      } },

    { method: 'GET',
      path: '/peers',
      ...peers.index,
      config: {
        tags: ['api', 'peers']
      }
    },
    { method: 'GET',
      path: '/peers/get',
      ...peers.show,
      config: {
        tags: ['api', 'peers']
      }},
    { method: 'GET',
      path: '/peers/get/',
      ...peers.show,
      config: {
        tags: ['api', 'peers']
      }}, // v1 inconsistency
    { method: 'GET',
      path: '/peers/version',
      ...peers.version,
      config: {
        tags: ['api', 'peers']
      }},

    { method: 'GET',
      path: '/signatures/fee',
      ...signatures.fee,
      config: {
        tags: ['api', 'signatures']
      }},

    { method: 'GET',
      path: '/transactions',
      ...transactions.index,
      config: {
        tags: ['api', 'transactions']
      }},
    { method: 'GET',
      path: '/transactions/get',
      ...transactions.show,
      config: {
        tags: ['api', 'transactions']
      }},
    { method: 'GET',
      path: '/transactions/get/',
      ...transactions.show,
      config: {
        tags: ['api', 'transactions']
      }}, // v1 inconsistency
    { method: 'GET',
      path: '/transactions/unconfirmed',
      ...transactions.unconfirmed,
      config: {
        tags: ['api', 'transactions']
      }},
    { method: 'GET',
      path: '/transactions/unconfirmed/get',
      ...transactions.showUnconfirmed,
      config: {
        tags: ['api', 'transactions']
      }}
  ])
}

/**
 * The struct used by hapi.js.
 * @type {Object}
 */
exports.plugin = {
  name: 'ARK Public API - v1',
  version: '0.1.0',
  register
}
