module.exports = {
  port: 4002,
  version: '2.0.0',
  fastRebuild: false,
  logging: {
    file: 'debug',
    console: 'debug'
  },
  db: {
    driver: 'app/database/sequelize',
    uri: 'sqlite:storage/database/devnet.sqlite',
    dialect: 'sqlite',
    logging: false
  },
  queue: {
    host: 'localhost',
    port: 6379
  },
  peers: {
    minimumNetworkReach: 10,
    blackList: []
  }
}
