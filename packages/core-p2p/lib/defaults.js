module.exports = {
  host: process.env.ARK_P2P_HOST || '0.0.0.0',
  port: process.env.ARK_P2P_PORT || 4002,
  remoteInterface: false,
  dns: [
    // Google
    '8.8.8.8',
    '8.8.4.4',
    // CloudFlare
    '1.1.1.1',
    '1.0.0.1',
    // OpenDNS
    '208.67.222.222',
    '208.67.220.220',
  ],
  ntp: ['pool.ntp.org', 'time.google.com'],
  whitelist: ['127.0.0.1', '::ffff:127.0.0.1'],
  // @see https://github.com/wraithgar/hapi-rate-limit
  rateLimit: {
    enabled: true,
    pathLimit: false,
    userLimit: 1000,
    ipWhitelist: ['127.0.0.1', '::ffff:127.0.0.1'],
  },
}
