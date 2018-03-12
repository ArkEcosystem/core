module.exports = (sequelize, DataTypes) => {
  const Block = sequelize.define('block', {
    id: {
      allowNull: false,
      autoIncrement: false,
      primaryKey: true,
      type: DataTypes.STRING(64)
    },
    version: DataTypes.SMALLINT,
    timestamp: {
      unique: true,
      type: DataTypes.INTEGER
    },
    previousBlock: DataTypes.STRING(64),
    height: {
      unique: true,
      type: DataTypes.INTEGER
    },
    numberOfTransactions: DataTypes.INTEGER,
    totalAmount: DataTypes.BIGINT,
    totalFee: DataTypes.BIGINT,
    reward: DataTypes.BIGINT,
    payloadLength: DataTypes.INTEGER,
    payloadHash: DataTypes.STRING(64),
    generatorPublicKey: {
      type: DataTypes.STRING(66)
      // very bad practice to disable references, easy to corrupt database...
      // references: {
      //   model: 'wallets',
      //   key: 'publicKey'
      // }
    },
    blockSignature: DataTypes.STRING(256)
  }, {})

  Block.associate = (models) => {
    Block.hasMany(models.transaction, {
      foreignKey: 'blockId',
      sourceKey: 'id',
      as: 'transactions'
    })

    // Block.belongsTo(models.wallet, {
    //   foreignKey: 'publicKey',
    //   sourceKey: 'generatorPublicKey',
    //   as: 'transactions'
    // })
  }

  return Block
}
