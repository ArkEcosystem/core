const request = require('./request')

module.exports = async () => {
  try {
    return (await request.get('/api/v2/node/configuration')).data.data.constants
  } catch (error) {
    console.log('Failed', error, error.message)

    return {}
  }
}
