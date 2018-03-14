module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('wallets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      address: {
        unique: true,
        type: Sequelize.STRING(36)
      },
      publicKey: {
        unique: true,
        type: Sequelize.STRING(66)
      },
      secondPublicKey: Sequelize.STRING(66),
      vote: Sequelize.STRING(66),
      username: Sequelize.STRING(64),
      balance: Sequelize.BIGINT,
      votebalance: Sequelize.BIGINT,
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
  down: (queryInterface, Sequelize) => queryInterface.dropTable('wallets')
}
