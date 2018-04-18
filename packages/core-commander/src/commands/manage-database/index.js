'use strict';

const prompts = require('prompts')
const questions = require('./questions')
const { onCancel } = require('../../utils')

/**
 * [description]
 * @return {[type]} [description]
 */
module.exports = async () => {
  const response = await prompts(questions, { onCancel })

  if (response.action) require(`./handlers/${response.action}`)()
}
