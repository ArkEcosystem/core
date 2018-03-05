module.exports = (sequelize, DataTypes) => {
  const Webhook = sequelize.define('Webhook', {
    fieldName: DataTypes.STRING
  }, {})

  Webhook.associate = (models) => {
    // associations can be defined here
  }

  return Webhook
}
