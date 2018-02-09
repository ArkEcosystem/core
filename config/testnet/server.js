module.exports = {
  test: true,
  port: 4000,
  version: '2.0.0',
  logging: {
    file: 'info',
    console: 'info'
  },
  db: {
    driver: 'app/database/sequelize',
    uri: 'sqlite:storage/database/test.sqlite',
    dialect: 'sqlite',
    logging: false
  },
  peers: {
    blackList: []
  }
}
