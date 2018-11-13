/**
 * Register the "parsedInt" validation rule.
 * @param  {AJV} ajv
 * @return {void}
 */
module.exports = ajv => {
  ajv.addFormat('parsedInt', {
    type: 'string',
    validate: value => {
      if (
        Number.isNaN(value) ||
        parseInt(value) !== value ||
        Number.isNaN(parseInt(value, 10))
      ) {
        return false
      }

      value = parseInt(value)

      return true
    },
  })
}
