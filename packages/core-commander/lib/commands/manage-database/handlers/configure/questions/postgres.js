'use strict';

/**
 * [exports description]
 * @type {Array}
 */
module.exports = [{
  type: 'text',
  name: 'host',
  message: 'What is your host?',
  initial: 'localhost'
}, {
  type: 'number',
  name: 'port',
  message: 'What is your port?',
  initial: 5432
}, {
  type: 'text',
  name: 'username',
  message: 'What is your username?'
}, {
  type: 'password',
  name: 'password',
  message: 'What is your password?'
}, {
  type: 'text',
  name: 'database',
  message: 'What is your database?'
}]
