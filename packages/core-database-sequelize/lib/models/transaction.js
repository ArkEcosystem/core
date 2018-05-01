'use strict';

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
    version: DataTypes.TINYINT.UNSIGNED, // TODO
    blockId: {
      type: DataTypes.STRING(64),
      // very bad practice to disable references, easy to corrupt database...
      references: {
        model: 'blocks',
        key: 'id'
      }
    },
    timestamp: DataTypes.INTEGER.UNSIGNED,
    senderPublicKey: {
      type: DataTypes.STRING(66)
      // very bad practice to disable references, easy to corrupt database...
      // references: {
      //   model: 'wallets',
      //   key: 'publicKey'
      // }
    },
    recipientId: {
      type: DataTypes.STRING(36)
      // very bad practice to disable references, easy to corrupt database...
      // references: {
      //   model: 'wallets',
      //   key: 'address'
      // }
    },
    type: DataTypes.TINYINT.UNSIGNED,
    vendorFieldHex: DataTypes.BLOB('tiny'),
    amount: DataTypes.BIGINT,
    fee: DataTypes.BIGINT,
    serialized: DataTypes.BLOB
  }, {})

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.block)

    // Transaction.belongsTo(models.wallet, {
    //   foreignKey: 'publicKey',
    //   sourceKey: 'senderPublicKey',
    //   as: 'sender'
    // })

    // Transaction.belongsTo(models.wallet, {
    //   foreignKey: 'generatorPublicKey',
    //   sourceKey: 'recipientId',
    //   as: 'recipient'
    // })
  }

  return Transaction
}
