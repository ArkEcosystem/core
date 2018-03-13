const config = require(`config/${process.env.NETWORK}/api/public.json`)

module.exports = async () => {
  config.cache.enabled = false
}
