const prompts = require('prompts')
const questions = require('./questions')
const onCancel = require('../../../cancel')
const config = require(`config/${process.env.NETWORK}/server.json`)

module.exports = async (answers) => {
  config.redis = await prompts(questions, { onCancel })
}
