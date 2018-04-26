'use strict';

const crypto = require('crypto')

/**
 * [description]
 * @param  {String} bip38
 * @param  {String} address
 * @param  {String} password
 * @return {String}
 */
exports.encrypt = (bip38, address, password) => {
  const cipher = crypto.createCipher('aes-256-ctr', password)

  return cipher.update(`${bip38}:${address}`, 'utf8', 'hex') + cipher.final('hex')
}

/**
 * [description]
 * @param  {String} value
 * @param  {String} password
 * @return {String}
 */
exports.decrypt = (value, password) => {
  const decipher = crypto.createDecipher('aes-256-ctr', password)

  return (decipher.update(value, 'hex', 'utf8') + decipher.final('utf8')).split(':')
}
