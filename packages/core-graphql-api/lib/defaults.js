'use strict';

module.exports = {
  enabled: false,
  port: process.env.ARK_GRAPHQL_PORT || 4005,
  path: '/graphql',
  graphiql: true,
  pretty: true
}
