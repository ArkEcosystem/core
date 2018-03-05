module.exports = (sequelize, DataTypes) => {
  const Wallet = sequelize.define('Wallet', {
    fieldName: DataTypes.STRING
  }, {})

  Wallet.associate = (models) => {
    // associations can be defined here
  }

  return Wallet
}
