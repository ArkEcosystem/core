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
        isNaN(value)
        || parseInt(value) !== value
        || isNaN(parseInt(value, 10))
      ) {
        return false
      }

      value = parseInt(value)

      return true
    },
  })
}
