module.exports = (sequelize, DataTypes) => {
  const Block = sequelize.define('Block', {
    fieldName: DataTypes.STRING
  }, {})

  Block.associate = (models) => {
    // associations can be defined here
  }

  return Block
}
