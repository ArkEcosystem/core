module.exports = {
  dsn: process.env.PHANTOM_ERROR_TRACKER_SENTRY_DSN,
  debug: true,
  attachStacktrace: true,
  environment: process.env.PHANTOM_NETWORK_NAME,
}
