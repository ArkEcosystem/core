const prompts = require('prompts')
const questions = require('./questions')
const onCancel = require('../../../cancel')
const config = require(`config/${process.env.NETWORK}/api/public.json`)

module.exports = async (answers) => {
  const response = await prompts(questions, { onCancel })

  config.cache = {
    enabled: response.enabled,
    options: {
      name: 'redisCache',
      engine: 'catbox-redis',
      host: response.host,
      port: response.port,
      partition: 'cache',
      expiresIn: response.expiresIn
    }
  }
}
