'use strict'

/**
 * Define the round model.
 * @param  {Sequelize} sequelize
 * @param  {Sequelize.DataTypes} DataTypes
 * @return {Sequelize.Model}
 */
module.exports = (sequelize, DataTypes) => {
  const Round = sequelize.define('round', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    publicKey: {
      type: DataTypes.STRING(66)
      // very bad practice to disable references, easy to corrupt database...
      // references: {
      //   model: 'wallets',
      //   key: 'publicKey'
      // }
    },
    balance: DataTypes.BIGINT,
    round: DataTypes.BIGINT
  }, {})

  // Round.associate = (models) => {
  //   Round.belongsTo(models.wallet, {
  //     foreignKey: 'publicKey',
  //     sourceKey: 'publicKey',
  //     as: 'delegate'
  //   })
  // }

  return Round
}
