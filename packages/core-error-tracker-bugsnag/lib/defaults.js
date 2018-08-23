module.exports = {
  apiKey: process.env.PHANTOM_ERROR_TRACKER_BUGSNAG_API_KEY,
  configuration: {
    metaData: {
      network: process.env.PHANTOM_NETWORK_NAME,
    },
  },
}
