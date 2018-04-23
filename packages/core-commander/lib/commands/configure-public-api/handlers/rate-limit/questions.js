'use strict';

/**
 * [exports description]
 * @type {Array}
 */
module.exports = [{
  type: 'confirm',
  name: 'enabled',
  message: 'Would you like to enable rate limiting? (Recommended in Production)'
}, {
  type: 'number',
  name: 'limit',
  message: 'How many requests per minute do you want to allow?',
  initial: 300
}, {
  type: 'number',
  name: 'expires',
  message: 'When should the rate limit expire and be refreshed?',
  initial: 60000
}]
