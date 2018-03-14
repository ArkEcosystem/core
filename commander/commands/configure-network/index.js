const fs = require('fs-extra')
const prompts = require('prompts')
const moment = require('moment')
const questions = require('./questions')

module.exports = async () => {
  const response = await prompts(questions, { onCancel: () => process.exit() })

  if (fs.existsSync(process.env.ARK_CONFIG)) {
    await fs.copy(process.env.ARK_CONFIG, `${process.env.ARK_CONFIG}_${moment().format('YYYY-MM-DD_HH_mm_ss')}`)
  }

  await fs.remove(process.env.ARK_CONFIG)
  await fs.copy(`./config/${response.network}`, process.env.ARK_CONFIG)

  return response.network
}
