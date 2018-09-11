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
    await queryInterface.removeIndex('wallets', ['address', 'publicKey', 'vote', 'username'])

    await queryInterface.renameColumn('wallets', 'publicKey', 'public_key')
    await queryInterface.renameColumn('wallets', 'secondPublicKey', 'second_public_key')
    await queryInterface.renameColumn('wallets', 'voteBalance', 'vote_balance')
    await queryInterface.renameColumn('wallets', 'producedBlocks', 'produced_blocks')
    await queryInterface.renameColumn('wallets', 'missedBlocks', 'missed_blocks')
    await queryInterface.renameColumn('wallets', 'createdAt', 'created_at')
    await queryInterface.renameColumn('wallets', 'updatedAt', 'updated_at')

    return queryInterface.addIndex('wallets', ['address', 'public_key', 'vote', 'username'])
  },

  /**
   * Reverse the migrations.
   * @param  {Sequelize.QueryInterface} queryInterface
   * @param  {Sequelize} Sequelize
   * @return {void}
   */
  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('wallets', ['address', 'public_key', 'vote', 'username'])

    await queryInterface.renameColumn('wallets', 'updated_at', 'updatedAt')
    await queryInterface.renameColumn('wallets', 'created_at', 'createdAt')
    await queryInterface.renameColumn('wallets', 'missed_blocks', 'missedBlocks')
    await queryInterface.renameColumn('wallets', 'produced_blocks', 'producedBlocks')
    await queryInterface.renameColumn('wallets', 'vote_balance', 'voteBalance')
    await queryInterface.renameColumn('wallets', 'second_public_key', 'secondPublicKey')
    await queryInterface.renameColumn('wallets', 'public_key', 'publicKey')

    return queryInterface.addIndex('wallets', ['address', 'publicKey', 'vote', 'username'])
  }
}
