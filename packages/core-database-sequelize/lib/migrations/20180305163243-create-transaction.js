'use strict';

/**
 * [exports description]
 * @type {Object}
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('transactions', {
      id: {
        allowNull: false,
        autoIncrement: false,
        primaryKey: true,
        type: Sequelize.STRING(64)
      },
      version: Sequelize.BLOB('tiny'), // TODO
      blockId: {
        type: Sequelize.STRING(64)
        // references: {
        //   model: 'blocks',
        //   key: 'id'
        // }
      },
      timestamp: Sequelize.INTEGER.UNSIGNED,
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
      type: Sequelize.TINYINT.UNSIGNED,
      vendorFieldHex: Sequelize.BLOB('tiny'),
      amount: Sequelize.BIGINT.UNSIGNED,
      fee: Sequelize.BIGINT.UNSIGNED,
      serialized: Sequelize.BLOB(),
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
