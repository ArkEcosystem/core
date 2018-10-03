module.exports = {
  '@arkecosystem/core-config': {},
  '@arkecosystem/core-logger': {},
  '@arkecosystem/core-logger-winston': {
    transports: {
      console: {
        options: {
          colorize: true,
          level: process.env.ARK_LOG_LEVEL || 'debug'
        }
      },
      dailyRotate: {
        options: {
          filename: process.env.ARK_LOG_FILE || `${process.env.ARK_PATH_DATA}/logs/core/${process.env.ARK_NETWORK_NAME}/%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          level: process.env.ARK_LOG_LEVEL || 'debug',
          zippedArchive: true
        }
      }
    }
  },
  '@jeremiG/core-ipfs': {
    enabled: true,
    ipfsRepo: process.env.ARK_IPFS_PATH || './data/ipfs',
    ipfsPort1: process.env.ARK_IPFS_PORT_1 || 4042,
    ipfsPort2: process.env.ARK_IPFS_PORT_2 || 4047
  }
}
