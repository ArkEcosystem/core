module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('transaction', {
      id: {
        allowNull: false,
        autoIncrement: false,
        primaryKey: true,
        type: DataTypes.STRING(64)
      },
      version: DataTypes.SMALLINT,
      blockId: {
        type: DataTypes.STRING(64),
        references: {
          model: 'blocks',
          key: 'id'
        }
      },
      timestamp: DataTypes.INTEGER,
      senderPublicKey: {
        type: DataTypes.STRING(66),
        references: {
          model: 'wallets',
          key: 'publicKey'
        }
      },
      recipientId: {
        type: DataTypes.STRING(36),
        references: {
          model: 'wallets',
          key: 'address'
        }
      },
      type: DataTypes.SMALLINT,
      vendorFieldHex: DataTypes.BLOB,
      amount: DataTypes.BIGINT,
      fee: DataTypes.BIGINT,
      serialized: DataTypes.BLOB,
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      }
  }, {})

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.block, {
      foreignKey: 'id',
      sourceKey: 'blockId',
      as: 'block'
    })

    Transaction.belongsTo(models.wallet, {
      foreignKey: 'publicKey',
      sourceKey: 'senderPublicKey',
      as: 'sender'
    })

    Transaction.belongsTo(models.wallet, {
      foreignKey: 'generatorPublicKey',
      sourceKey: 'recipientId',
      as: 'recipient'
    })
  }

  return Transaction
}
