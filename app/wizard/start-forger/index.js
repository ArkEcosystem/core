const prompts = require('prompts')
const questions = require('./questions')
const onCancel = require('app/wizard/cancel')
// const pm2 = require('pm2')

module.exports = async (answers) => {
  const response = await prompts(questions, { onCancel })

  if (response.password) {
    // pm2.connect((err) => {
    //   if (err) {
    //     console.error(err)
    //     process.exit(2)
    //   }

    //   pm2.start('./ecosystems/devnet.config.js', (err, apps) => {
    //     pm2.disconnect()

    //     if (err) throw err
    //   })
    // })
  }
}
