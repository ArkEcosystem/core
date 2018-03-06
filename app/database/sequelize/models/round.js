module.exports = (sequelize, DataTypes) => {
  const Round = sequelize.define('round', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    publicKey: {
      type: DataTypes.STRING(66),
      references: {
        model: 'wallets',
        key: 'publicKey'
      }
    },
    balance: DataTypes.BIGINT,
    round: DataTypes.BIGINT,
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE
    }
  }, {})

  Round.associate = (models) => {
    Round.belongsTo(models.wallet, {
      foreignKey: 'publicKey',
      sourceKey: 'publicKey',
      as: 'delegate'
    })
  }

  return Round
}
