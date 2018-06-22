'use strict'

/**
 * The blocks migration.
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
    await queryInterface.createTable('blocks', {
      id: {
        allowNull: false,
        autoIncrement: false,
        primaryKey: true,
        type: Sequelize.STRING(64)
      },
      version: Sequelize.SMALLINT, // TODO
      timestamp: {
        unique: true,
        type: Sequelize.INTEGER
      },
      previousBlock: Sequelize.STRING(64),
      height: {
        unique: true,
        type: Sequelize.INTEGER
      },
      numberOfTransactions: Sequelize.INTEGER, // TODO
      totalAmount: Sequelize.BIGINT,
      totalFee: Sequelize.BIGINT,
      reward: Sequelize.BIGINT,
      payloadLength: Sequelize.INTEGER,
      payloadHash: Sequelize.STRING(64),
      generatorPublicKey: {
        type: Sequelize.STRING(66)
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
  /**
   * Reverse the migrations.
   * @param  {Sequelize.QueryInterface} queryInterface
   * @param  {Sequelize} Sequelize
   * @return {void}
   */
  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable('blocks')
  }
}
