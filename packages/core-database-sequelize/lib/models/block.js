'use strict'

/**
 * Define the block model.
 * @param  {Sequelize} sequelize
 * @param  {Sequelize.DataTypes} DataTypes
 * @return {Sequelize.Model}
 */
module.exports = (sequelize, DataTypes) => {
  const Block = sequelize.define('block', {
    id: {
      allowNull: false,
      autoIncrement: false,
      primaryKey: true,
      type: DataTypes.STRING(64)
    },
    version: DataTypes.SMALLINT, // TODO
    timestamp: {
      unique: true,
      type: DataTypes.INTEGER
    },
    previousBlock: {
        type: DataTypes.STRING(64),
        field: 'previous_block'
    },
    height: {
      unique: true,
      type: DataTypes.INTEGER
    },
    numberOfTransactions: {
        type: DataTypes.INTEGER, // TODO
        field: 'number_of_transactions'
    },
    totalAmount: {
        type: DataTypes.BIGINT,
        field: 'total_amount',
        set (bignum) {
          this.setDataValue('totalAmount', +bignum.toString());
        }
    },
    totalFee: {
        type: DataTypes.BIGINT,
        field: 'total_fee',
        set (bignum) {
          this.setDataValue('totalFee', +bignum.toString());
        }
    },
    reward: {
        type: DataTypes.BIGINT,
        set (bignum) {
          this.setDataValue('reward', +bignum.toString());
        }
    },
    payloadLength: {
        type: DataTypes.INTEGER,
        field: 'payload_length'
    },
    payloadHash: {
        type: DataTypes.STRING(64),
        field: 'payload_hash'
    },
    generatorPublicKey: {
      type: DataTypes.STRING(66),
      field: 'generator_public_key'
    },
    blockSignature: {
        type: DataTypes.STRING(256),
        field: 'block_signature'
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

  return Block
}
