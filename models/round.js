module.exports = (sequelize, DataTypes) => {
  const Round = sequelize.define('Round', {
    fieldName: DataTypes.STRING
  }, {})

  Round.associate = (models) => {
    // associations can be defined here
  }

  return Round
}
