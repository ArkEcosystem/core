'use strict'

/**
 * The wallets migration.
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
    await queryInterface.createTable('wallets', {
      address: {
        allowNull: false,
        unique: true,
        primaryKey: true,
        type: Sequelize.STRING(36)
      },
      publicKey: {
        unique: true,
        allowNull: false,
        type: Sequelize.STRING(66)
      },
      secondPublicKey: Sequelize.STRING(66),
      vote: Sequelize.STRING(66),
      username: Sequelize.STRING(64),
      balance: Sequelize.BIGINT,
      voteBalance: Sequelize.BIGINT,
      producedBlocks: Sequelize.BIGINT,
      missedBlocks: Sequelize.BIGINT,
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })

    queryInterface.addIndex('wallets', ['address', 'publicKey', 'vote', 'username'])
  },
  /**
   * Reverse the migrations.
   * @param  {Sequelize.QueryInterface} queryInterface
   * @param  {Sequelize} Sequelize
   * @return {void}
   */
  async down (queryInterface, Sequelize) {
    return queryInterface.dropTable('wallets')
  }
}
