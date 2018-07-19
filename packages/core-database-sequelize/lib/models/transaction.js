'use strict'

/**
 * Define the transaction model.
 * @param  {Sequelize} sequelize
 * @param  {Sequelize.DataTypes} DataTypes
 * @return {Sequelize.Model}
 */
module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('transaction', {
    id: {
      allowNull: false,
      autoIncrement: false,
      primaryKey: true,
      type: DataTypes.STRING(64)
    },
    version: DataTypes.SMALLINT, // TODO
    blockId: {
      type: DataTypes.STRING(64)
    },
    timestamp: DataTypes.INTEGER,
    senderPublicKey: {
      type: DataTypes.STRING(66)
    },
    recipientId: {
      type: DataTypes.STRING(36)
    },
    type: DataTypes.SMALLINT,
    vendorFieldHex: DataTypes.BLOB,
    amount: DataTypes.BIGINT,
    fee: DataTypes.BIGINT,
    serialized: DataTypes.BLOB
  }, {})

  return Transaction
}
