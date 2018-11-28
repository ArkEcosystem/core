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
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('webhooks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      event: Sequelize.STRING,
      target: Sequelize.STRING,
      conditions: Sequelize.JSON,
      token: {
        unique: true,
        type: Sequelize.STRING,
      },
      enabled: Sequelize.BOOLEAN,
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    })

    queryInterface.addIndex('webhooks', ['event'])
  },
  /**
   * Reverse the migrations.
   * @param  {Sequelize.QueryInterface} queryInterface
   * @param  {Sequelize} Sequelize
   * @return {void}
   */
  async down(queryInterface, Sequelize) {
    return queryInterface.dropTable('webhooks')
  },
}
