'use strict'

module.exports = {
  dsn: process.env.ARK_ERROR_TRACKER_SENTRY_DSN,
  debug: true,
  attachStacktrace: true,
  environment: process.env.ARK_NETWORK_NAME
}
