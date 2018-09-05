'use strict';

/**
 * Default configuration for the @arkecosystem/core-graphql plugin
 */
module.exports = {
  enabled: false,
  host: process.env.ARK_GRAPHQL_HOST || '0.0.0.0',
  port: process.env.ARK_GRAPHQL_PORT || 4005,
  path: '/graphql'
}
