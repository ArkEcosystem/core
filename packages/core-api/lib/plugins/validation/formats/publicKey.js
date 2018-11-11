/**
 * Register the "publicKey" validation rule.
 * @param  {AJV} ajv
 * @return {void}
 */
module.exports = ajv => {
  ajv.addFormat('publicKey', {
    type: 'string',
    validate: value => {
      try {
        return Buffer.from(value, 'hex').length === 33
      } catch (e) {
        return false
      }
    },
  })
}
