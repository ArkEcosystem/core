'use strict';

/**
 * [exports description]
 * @type {Object}
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('blocks', {
      id: {
        allowNull: false,
        autoIncrement: false,
        primaryKey: true,
        type: Sequelize.STRING(64)
      },
      version: Sequelize.SMALLINT.UNSIGNED, // TODO
      timestamp: {
        unique: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      previousBlock: Sequelize.STRING(64),
      height: {
        unique: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      numberOfTransactions: Sequelize.TINYINT.UNSIGNED, // TODO
      totalAmount: Sequelize.BIGINT,
      totalFee: Sequelize.BIGINT,
      reward: Sequelize.BIGINT,
      payloadLength: Sequelize.MEDIUMINT.UNSIGNED,
      payloadHash: Sequelize.STRING(64),
      generatorPublicKey: {
        type: Sequelize.STRING(66)
        // very bad practice to disable references, easy to corrupt database...
        // references: {
        //   model: 'wallets',
        //   key: 'publicKey'
        // }
      },
      blockSignature: Sequelize.STRING(256),
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })

    queryInterface.addIndex('blocks', ['height', 'generatorPublicKey'])
  },
  down: (queryInterface, Sequelize) => queryInterface.dropTable('blocks')
}
