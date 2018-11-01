'use strict'

module.exports = {
  apiKey: process.env.ARK_ERROR_TRACKER_BUGSNAG_API_KEY,
  configuration: {
    metaData: {
      network: process.env.ARK_NETWORK_NAME
    }
  }
}
