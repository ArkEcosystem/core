module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    fieldName: DataTypes.STRING
  }, {})

  Transaction.associate = (models) => {
    // associations can be defined here
  }

  return Transaction
}
