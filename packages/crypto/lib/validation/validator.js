const engine = require('./engine')

class Validator {
  /**
   * Create a new validator instance.
   */
  constructor () {
    this.rules = require('./rules')
    this.engine = engine
  }

  /**
   * Run the validator's rules against its data.
   * @param  {*} attributes
   * @param  {Object} rules
   * @return {void}
   */
  async validate (attributes, rules) {
    this.__reset()

    if (rules instanceof String) {
      return this.__validateWithRule(attributes, rules)
    }

    if (rules instanceof Function) {
      return this.__validateWithFunction(attributes, rules)
    }

    if (rules instanceof Object) {
      return this.__validateWithJoi(attributes, rules)
    }
  }

  /**
   * Determine if the data passes the validation rules.
   * @return {Boolean}
   */
  passes () {
    return this.results.passes
  }

  /**
   * Determine if the data fails the validation rules.
   * @return {Boolean}
   */
  fails () {
    return this.results.fails
  }

  /**
   * Get the validated data.
   * @return {*}
   */
  validated () {
    return this.results.data
  }

  /**
   * Get the validation errors.
   * @return {Array}
   */
  errors () {
    return this.results.errors
  }

  /**
   * Add a new rule to the validator.
   * @return {void}
   */
  extend (name, implementation) {
    this.rules[name] = implementation
  }

  /**
   * Run the validator's rules against its data using a rule.
   * @param  {*} attributes
   * @param  {String} rule
   * @return {void}
   */
  __validateWithRule (attributes, rules) {
    const validate = this.rules[rules]

    if (!rules) {
      throw new Error('An invalid set of rules was provided.')
    }

    this.results = validate(attributes)
  }

  /**
   * Run the validator's rules against its data using a function.
   * @param  {*} attributes
   * @param  {String} rule
   * @return {void}
   */
  __validateWithFunction (attributes, validate) {
    this.results = validate(attributes)
  }

  /**
   * Run the validator's rules against its data using Joi.
   * @param  {*} attributes
   * @param  {String} rule
   * @return {void}
   */
  __validateWithJoi (attributes, rules) {
    const { error, value } = this.engine.validate(attributes, rules)

    this.results = {
      data: value,
      errors: error ? error.details : null,
      passes: !error,
      fails: error
    }
  }

  /**
   * Reset any previous results.
   */
  __reset () {
    this.results = null
  }
}

module.exports = new Validator()
