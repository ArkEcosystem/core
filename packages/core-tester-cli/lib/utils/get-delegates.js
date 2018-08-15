const paginate = require('./paginate')

module.exports = async (publicKey) => {
  try {
    const delegates = await paginate('/api/v2/delegates')

    return delegates
  } catch (error) {
  }

  return []
}
