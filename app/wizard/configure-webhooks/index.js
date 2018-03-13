const prompts = require('prompts')
const argon2 = require('argon2')
const questions = require('./questions')
const onCancel = require('../cancel')
const config = require(`config/${process.env.NETWORK}/webhooks.json`)

module.exports = async (answers) => {
  const response = await prompts(questions, { onCancel })

  config.webhooks.enabled = response.enabled

  const password = await argon2.hash(response.password, { type: argon2.argon2id })
  config.webhooks.password = password
}
