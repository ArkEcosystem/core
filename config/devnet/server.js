module.exports = {
  port: 4002,
  version: "2.0.0",
  fastRebuild: false,
  logging: {
    file: "debug",
    console: "debug"
  },
  db: {
    driver: "app/database/sequelize",
    uri: "sqlite:storage/database/devnet.sqlite",
    dialect: "sqlite",
    logging: false
  },
  peers: {
    minimumNetworkReach: 10,
    blackList: []
  }
}
