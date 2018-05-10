module.exports = async () => {
  const sequelize = new (require('../../../lib/connection'))({
    dialect: 'sqlite',
    storage: ':memory:'
  })

  return sequelize.make()
}
