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
    await queryInterface.removeIndex('blocks', ['height', 'generatorPublicKey'])

    await queryInterface.renameColumn('blocks', 'previousBlock', 'previous_block')
    await queryInterface.renameColumn('blocks', 'numberOfTransactions', 'number_of_transactions')
    await queryInterface.renameColumn('blocks', 'totalAmount', 'total_amount')
    await queryInterface.renameColumn('blocks', 'totalFee', 'total_fee')
    await queryInterface.renameColumn('blocks', 'payloadLength', 'payload_length')
    await queryInterface.renameColumn('blocks', 'payloadHash', 'payload_hash')
    await queryInterface.renameColumn('blocks', 'generatorPublicKey', 'generator_public_key')
    await queryInterface.renameColumn('blocks', 'blockSignature', 'block_signature')
    await queryInterface.renameColumn('blocks', 'createdAt', 'created_at')
    await queryInterface.renameColumn('blocks', 'updatedAt', 'updated_at')

    return queryInterface.addIndex('blocks', ['height', 'generator_public_key'])
  },

  /**
   * Reverse the migrations.
   * @param  {Sequelize.QueryInterface} queryInterface
   * @param  {Sequelize} Sequelize
   * @return {void}
   */
  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('blocks', ['height', 'generator_public_key'])

    await queryInterface.renameColumn('blocks', 'updated_at', 'updatedAt')
    await queryInterface.renameColumn('blocks', 'created_at', 'createdAt')
    await queryInterface.renameColumn('blocks', 'block_signature', 'blockSignature')
    await queryInterface.renameColumn('blocks', 'generator_public_key', 'generatorPublicKey')
    await queryInterface.renameColumn('blocks', 'payload_hash', 'payloadHash')
    await queryInterface.renameColumn('blocks', 'payload_length', 'payloadLength')
    await queryInterface.renameColumn('blocks', 'total_fee', 'totalFee')
    await queryInterface.renameColumn('blocks', 'total_amount', 'totalAmount')
    await queryInterface.renameColumn('blocks', 'number_of_transactions', 'numberOfTransactions')
    await queryInterface.renameColumn('blocks', 'previous_block', 'previousBlock')

    return queryInterface.addIndex('blocks', ['height', 'generatorPublicKey'])
  }
}
