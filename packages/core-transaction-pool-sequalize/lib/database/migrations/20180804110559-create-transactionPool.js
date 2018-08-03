'use strict'

/**
 * The webhooks migration.
 * @type {Object}
 */
module.exports = {
  /**
   * Run the migrations.
   * @param  {Sequelize.QueryInterface} queryInterface
   * @param  {Sequelize} Sequelize
   * @return {void}
   */
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('transactions', {
      id: {
        allowNull: false,
        autoIncrement: false,
        primaryKey: true,
        type: Sequelize.STRING(64)
      },
      serialized: Sequelize.STRING,
      senderPublicKey: {
        type: Sequelize.STRING(66),
        field: 'sender_public_key'
      },
      timestamp: Sequelize.INTEGER,
      expiration: Sequelize.INTEGER,
      createdAt: {
          type: Sequelize.DATE,
          field: 'created_at'
      },
      updatedAt: {
          type: Sequelize.DATE,
          field: 'updated_at'
      }
    })

    queryInterface.addIndex('transactions', ['id', 'sender_public_key', 'expiration', 'created_at'])
  },

  /**
   * Reverse the migrations.
   * @param  {Sequelize.QueryInterface} queryInterface
   * @param  {Sequelize} Sequelize
   * @return {void}
   */
  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable('transactions')
  }
};
