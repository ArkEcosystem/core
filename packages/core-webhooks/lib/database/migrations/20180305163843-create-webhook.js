'use strict';

module.exports = {
  /**
   * [description]
   * @param  {[type]} queryInterface
   * @param  {[type]} Sequelize
   * @return {[type]}
   */
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('webhooks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      event: Sequelize.STRING,
      target: Sequelize.STRING,
      conditions: Sequelize.JSON,
      token: {
        unique: true,
        type: Sequelize.STRING
      },
      enabled: Sequelize.BOOLEAN,
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })

    queryInterface.addIndex('webhooks', ['event'])
  },

  /**
   * [description]
   * @param  {[type]} queryInterface
   * @param  {[type]} Sequelize
   * @return {[type]}
   */
  down: (queryInterface, Sequelize) => queryInterface.dropTable('webhooks')
}
