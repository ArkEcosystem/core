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
      type: DataTypes.STRING(64),
      field: 'block_id'
    },
    sequence: {
      allowNull: false,
      type: DataTypes.SMALLINT
    },
    timestamp: DataTypes.INTEGER,
    senderPublicKey: {
      type: DataTypes.STRING(66),
      field: 'sender_public_key'
    },
    recipientId: {
      type: DataTypes.STRING(36),
      field: 'recipient_id'
    },
    type: DataTypes.SMALLINT,
    vendorFieldHex: {
        type: DataTypes.BLOB,
        field: 'vendor_field_hex'
    },
    amount: DataTypes.BIGINT,
    fee: DataTypes.BIGINT,
    serialized: DataTypes.BLOB
  }, {})

  return Transaction
}
