const ip = require('ip')

/**
 * Register the "ip" validation rule.
 * @param  {AJV} ajv
 * @return {void}
 */
module.exports = ajv => {
  ajv.addFormat('ip', {
    type: 'string',
    validate: value => ip.isV4Format(value) || ip.isV6Format(value),
  })
}
