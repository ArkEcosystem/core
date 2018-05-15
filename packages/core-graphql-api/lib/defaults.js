'use strict';

module.exports = {
  enabled: true,
  port: process.env.ARK_GRAPHQL_PORT || 4005,
  path: '/graphql',
  graphiql: true,
  pretty: true
}
