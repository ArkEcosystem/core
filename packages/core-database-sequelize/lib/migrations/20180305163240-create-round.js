'use strict';

/**
 * The rounds migration.
 * @type {Object}
 */
module.exports = {
  /**
   * Run the migrations.
   * @param  {Sequelize.QueryInterface} queryInterface
   * @param  {Sequelize} Sequelize
   * @return {void}
   */
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('rounds', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      publicKey: {
        type: Sequelize.STRING(66)
        // very bad practice to disable references, easy to corrupt database...
        // references: {
        //   model: 'wallets',
        //   key: 'publicKey'
        // }
      },
      balance: Sequelize.BIGINT.UNSIGNED,
      round: Sequelize.INTEGER.UNSIGNED,
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })

    await queryInterface.addConstraint('rounds', ['publicKey', 'round'], {
      type: 'unique',
      name: 'rounds_unique'
    })

    queryInterface.addIndex('rounds', ['publicKey', 'round'])
  },
  /**
   * Reverse the migrations.
   * @param  {Sequelize.QueryInterface} queryInterface
   * @param  {Sequelize} Sequelize
   * @return {void}
   */
  down: (queryInterface, Sequelize) => queryInterface.dropTable('rounds')
}
