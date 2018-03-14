module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('blocks', {
      id: {
        allowNull: false,
        autoIncrement: false,
        primaryKey: true,
        type: Sequelize.STRING(64)
      },
      version: Sequelize.SMALLINT,
      timestamp: {
        unique: true,
        type: Sequelize.INTEGER
      },
      previousBlock: Sequelize.STRING(64),
      height: {
        unique: true,
        type: Sequelize.INTEGER
      },
      numberOfTransactions: Sequelize.INTEGER,
      totalAmount: Sequelize.BIGINT,
      totalFee: Sequelize.BIGINT,
      reward: Sequelize.BIGINT,
      payloadLength: Sequelize.INTEGER,
      payloadHash: Sequelize.STRING(64),
      generatorPublicKey: {
        type: Sequelize.STRING(66)
        // very bad practice to disable references, easy to corrupt database...
        // references: {
        //   model: 'wallets',
        //   key: 'publicKey'
        // }
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
  down: (queryInterface, Sequelize) => queryInterface.dropTable('blocks')
}
