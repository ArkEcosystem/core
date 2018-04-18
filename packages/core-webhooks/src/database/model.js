'use strict';

/**
 * [description]
 * @param  {[type]} sequelize [description]
 * @param  {[type]} DataTypes [description]
 * @return {[type]}           [description]
 */
module.exports = (sequelize, DataTypes) => {
  const Webhook = sequelize.define('webhook', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    event: DataTypes.STRING,
    target: DataTypes.STRING,
    conditions: DataTypes.JSON,
    token: {
      unique: true,
      type: DataTypes.STRING
    },
    enabled: DataTypes.BOOLEAN
  }, {})

  return Webhook
}
