'use strict'

/**
 * The transactions migration.
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
      version: Sequelize.SMALLINT, // TODO
      blockId: {
        type: Sequelize.STRING(64)
      },
      timestamp: Sequelize.INTEGER,
      senderPublicKey: {
        type: Sequelize.STRING(66)
      },
      recipientId: {
        type: Sequelize.STRING(36)
      },
      type: Sequelize.SMALLINT,
      vendorFieldHex: Sequelize.BLOB,
      amount: Sequelize.BIGINT,
      fee: Sequelize.BIGINT,
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
  /**
   * Reverse the migrations.
   * @param  {Sequelize.QueryInterface} queryInterface
   * @param  {Sequelize} Sequelize
   * @return {void}
   */
  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable('transactions')
  }
}
