'use strict'

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
  async up (queryInterface, Sequelize) {
    await queryInterface.removeConstraint('rounds', 'rounds_unique')
    await queryInterface.removeIndex('rounds', ['publicKey', 'round'])

    await queryInterface.renameColumn('rounds', 'publicKey', 'public_key')
    await queryInterface.renameColumn('rounds', 'createdAt', 'created_at')
    await queryInterface.renameColumn('rounds', 'updatedAt', 'updated_at')

    await queryInterface.addConstraint('rounds', ['public_key', 'round'], {
        type: 'unique',
        name: 'rounds_unique'
    })

    return queryInterface.addIndex('rounds', ['public_key', 'round'])
  },

  /**
   * Reverse the migrations.
   * @param  {Sequelize.QueryInterface} queryInterface
   * @param  {Sequelize} Sequelize
   * @return {void}
   */
  async down (queryInterface, Sequelize) {
    await queryInterface.removeConstraint('rounds', 'rounds_unique')
    await queryInterface.removeIndex('rounds', ['public_key', 'round'])

    await queryInterface.renameColumn('rounds', 'updated_at', 'updatedAt')
    await queryInterface.renameColumn('rounds', 'created_at', 'createdAt')
    await queryInterface.renameColumn('rounds', 'public_key', 'publicKey')

    await queryInterface.addConstraint('rounds', ['publicKey', 'round'], {
        type: 'unique',
        name: 'rounds_unique'
    })

    return queryInterface.addIndex('rounds', ['publicKey', 'round'])
  }
}
