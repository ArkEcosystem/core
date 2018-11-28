/**
 * Register the "vendorField" validation rule.
 * @param  {AJV} ajv
 * @return {void}
 */
module.exports = ajv => {
  ajv.addFormat('vendorField', {
    type: 'string',
    validate: value => {
      try {
        return Buffer.from(value).length < 65
      } catch (e) {
        return false
      }
    },
  })
}
