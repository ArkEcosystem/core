'use strict'

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
      type: DataTypes.STRING(66),
      field: 'public_key'
    },
    secondPublicKey: {
        type: DataTypes.STRING(66),
        field: 'second_public_key'
    },
    vote: DataTypes.STRING(66),
    username: DataTypes.STRING(64),
    balance: DataTypes.BIGINT,
    voteBalance: {
        type: DataTypes.BIGINT,
        field: 'vote_balance'
    },
    producedBlocks: {
        type: DataTypes.BIGINT,
        field: 'produced_blocks'
    },
    missedBlocks: {
        type: DataTypes.BIGINT,
        field: 'missed_blocks'
    },
    createdAt: {
        type: DataTypes.DATE,
        field: 'created_at'
    },
    updatedAt: {
        type: DataTypes.DATE,
        field: 'updated_at'
    }
  }, {})

  return Wallet
}
