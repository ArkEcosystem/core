module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('transactions', {
      id: {
        allowNull: false,
        autoIncrement: false,
        primaryKey: true,
        type: Sequelize.STRING(64)
      },
      version: Sequelize.SMALLINT,
      blockId: {
        type: Sequelize.STRING(64),
        references: {
          model: 'blocks',
          key: 'id'
        }
      },
      timestamp: Sequelize.INTEGER,
      senderPublicKey: Sequelize.STRING(66),
      recipientId: Sequelize.STRING(36),
      type: Sequelize.SMALLINT,
      vendorFieldHex: Sequelize.BLOB,
      amount: Sequelize.BIGINT,
      fee: Sequelize.BIGINT,
      serialized: Sequelize.BLOB,
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })

    queryInterface.addIndex('transactions', ['id', 'senderPublicKey', 'recipientId', 'vendorFieldHex', 'timestamp'])
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('transactions')
  }
}
