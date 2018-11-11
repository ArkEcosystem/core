/**
 * Register the "signature" validation rule.
 * @param  {AJV} ajv
 * @return {void}
 */
module.exports = ajv => {
  ajv.addFormat('signature', {
    type: 'string',
    validate: value => {
      try {
        return Buffer.from(value, 'hex').length < 73
      } catch (e) {
        return false
      }
    },
  })
}
