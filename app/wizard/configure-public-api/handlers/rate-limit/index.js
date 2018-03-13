const prompts = require('prompts')
const questions = require('./questions')
const onCancel = require('../../../cancel')
const config = require(`config/${process.env.NETWORK}/api/public.json`)

module.exports = async (answers) => {
  config.rateLimit = await prompts(questions, { onCancel })
}
