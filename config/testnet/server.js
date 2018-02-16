module.exports = {
  test: true,
  port: 4000,
  version: '2.0.0',
  fastRebuild: false,
  delegateEncryption: false,
  logging: {
    file: 'debug',
    console: 'debug'
  },
  db: {
    driver: 'app/database/sequelize',
    uri: 'sqlite:storage/database/test.sqlite',
    dialect: 'sqlite',
    logging: false
  },
  queue: {
    host: 'localhost',
    port: 6379
  },
  peers: {
    blackList: []
  }
}
