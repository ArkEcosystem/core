module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('rounds', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      publicKey: {
        type: Sequelize.STRING(66),
        references: {
          model: 'wallets',
          key: 'publicKey'
        }
      },
      balance: Sequelize.BIGINT,
      round: Sequelize.BIGINT,
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })

    await queryInterface.addConstraint('rounds', ['publicKey', 'round'], {
      type: 'unique',
      name: 'rounds_unique'
    })

    queryInterface.addIndex('rounds', ['address', 'publicKey', 'vote', 'username'])
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('rounds')
  }
}
