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
    await queryInterface.removeIndex('transactions', ['senderPublicKey', 'recipientId', 'vendorFieldHex', 'timestamp'])

    await queryInterface.renameColumn('transactions', 'blockId', 'block_id')
    await queryInterface.renameColumn('transactions', 'senderPublicKey', 'sender_public_key')
    await queryInterface.renameColumn('transactions', 'recipientId', 'recipient_id')
    await queryInterface.renameColumn('transactions', 'vendorFieldHex', 'vendor_field_hex')
    await queryInterface.renameColumn('transactions', 'createdAt', 'created_at')
    await queryInterface.renameColumn('transactions', 'updatedAt', 'updated_at')

    return queryInterface.addIndex('transactions', ['sender_public_key', 'recipient_id', 'vendor_field_hex', 'timestamp'])
  },

  /**
   * Reverse the migrations.
   * @param  {Sequelize.QueryInterface} queryInterface
   * @param  {Sequelize} Sequelize
   * @return {void}
   */
  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('transactions', ['sender_public_key', 'recipient_id', 'vendor_field_hex', 'timestamp'])

    await queryInterface.renameColumn('transactions', 'updated_at', 'updatedAt')
    await queryInterface.renameColumn('transactions', 'created_at', 'createdAt')
    await queryInterface.renameColumn('transactions', 'vendor_field_hex', 'vendorFieldHex')
    await queryInterface.renameColumn('transactions', 'recipient_id', 'recipientId')
    await queryInterface.renameColumn('transactions', 'sender_public_key', 'senderPublicKey')
    await queryInterface.renameColumn('transactions', 'block_id', 'blockId')

    await queryInterface.addIndex('transactions', ['senderPublicKey', 'recipientId', 'vendorFieldHex', 'timestamp'])
  }
}
