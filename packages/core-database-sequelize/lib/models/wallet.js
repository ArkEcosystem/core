'use strict';

/**
 * Define the wallet model.
 * @param  {Sequelize} sequelize
 * @param  {Sequelize.DataTypes} DataTypes
 * @return {Sequelize.Model}
 */
module.exports = (sequelize, DataTypes) => {
  const Wallet = sequelize.define('wallet', {
    address: {
      allowNull: false,
      unique: true,
      primaryKey: true,
      type: DataTypes.STRING(36)
    },
    publicKey: {
      unique: true,
      type: DataTypes.STRING(66)
    },
    secondPublicKey: DataTypes.STRING(66),
    vote: DataTypes.STRING(66),
    username: DataTypes.STRING(64),
    balance: DataTypes.BIGINT,
    votebalance: DataTypes.BIGINT,
    producedBlocks: DataTypes.BIGINT,
    missedBlocks: DataTypes.BIGINT
  }, {})

  // Wallet.associate = (models) => {
  //   Wallet.hasMany(models.block, {
  //     foreignKey: 'generatorPublicKey',
  //     sourceKey: 'publicKey',
  //     as: 'blocks'
  //   })

  //   Wallet.hasMany(models.transaction, {
  //     foreignKey: 'senderPublicKey',
  //     sourceKey: 'publicKey',
  //     as: 'sentTransactions'
  //   })

  //   Wallet.hasMany(models.transaction, {
  //     foreignKey: 'recipientId',
  //     sourceKey: 'address',
  //     as: 'receivedTransactions'
  //   })
  // }

  return Wallet
}
