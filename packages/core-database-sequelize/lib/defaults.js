'use strict'

module.exports = {
  uri: `sqlite:${process.env.ARK_PATH_DATA}/database/${process.env.ARK_NETWORK}.sqlite`,
  dialect: 'sqlite',
  logging: false
}
