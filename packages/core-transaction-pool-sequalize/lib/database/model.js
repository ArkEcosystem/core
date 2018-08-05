'use strict'

/**
 * Define the transactionPool model.
 * @param  {Sequelize} sequelize
 * @param  {Sequelize.DataTypes} DataTypes
 * @return {Sequelize.Model}
 */
module.exports = (sequelize, DataTypes) => {
  const transaction = sequelize.define('transaction', {
    id: {
      allowNull: false,
      autoIncrement: false,
      primaryKey: true,
      type: DataTypes.STRING(64)
    },
    serialized: DataTypes.STRING,
    senderPublicKey: {
      type: DataTypes.STRING(66),
      field: 'sender_public_key'
    },
    timestamp: DataTypes.INTEGER,
    expiration: DataTypes.INTEGER,
    createdAt: {
        type: DataTypes.DATE,
        field: 'created_at'
    },
    updatedAt: {
        type: DataTypes.DATE,
        field: 'updated_at'
    }
  }, {})

  return transaction
}
