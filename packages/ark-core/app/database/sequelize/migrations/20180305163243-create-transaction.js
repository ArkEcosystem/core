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
        type: Sequelize.STRING(64)
        // references: {
        //   model: 'blocks',
        //   key: 'id'
        // }
      },
      timestamp: Sequelize.INTEGER,
      senderPublicKey: {
        type: Sequelize.STRING(66)
        // very bad practice to disable references, easy to corrupt database...
        // references: {
        //   model: 'wallets',
        //   key: 'publicKey'
        // }
      },
      recipientId: {
        type: Sequelize.STRING(36)
        // very bad practice to disable references, easy to corrupt database...
        // references: {
        //   model: 'wallets',
        //   key: 'address'
        // }
      },
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

    queryInterface.addIndex('transactions', ['senderPublicKey', 'recipientId', 'vendorFieldHex', 'timestamp'])
  },
  down: (queryInterface, Sequelize) => queryInterface.dropTable('transactions')
}
