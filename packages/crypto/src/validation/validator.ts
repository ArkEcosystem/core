import { Engine } from "./engine";
import * as customRules from "./rules";

export class Validator {
    public rules: any;
    public results: any;

    /**
     * Create a new validator instance.
     */
    constructor() {
        this.rules = customRules;
    }

    /**
     * Run the validator's rules against its data.
     * @param  {*} attributes
     * @param  {Object|Function|String} rules
     * @return {void|Boolean}
     */
    public async validate(attributes, rules) {
        this.reset();

        if (typeof rules === "string") {
            return this.validateWithRule(attributes, rules);
        }

        if (rules instanceof Function) {
            return this.validateWithFunction(attributes, rules);
        }

        if (rules instanceof Object) {
            return this.validateWithJoi(attributes, rules);
        }

        return false;
    }

    /**
     * Determine if the data passes the validation rules.
     * @return {Boolean}
     */
    public passes() {
        return this.results.passes;
    }

    /**
     * Determine if the data fails the validation rules.
     * @return {Boolean}
     */
    public fails() {
        return this.results.fails;
    }

    /**
     * Get the validated data.
     * @return {*}
     */
    public validated() {
        return this.results.data;
    }

    /**
     * Get the validation errors.
     * @return {Array}
     */
    public errors() {
        return this.results.errors;
    }

    /**
     * Add a new rule to the validator.
     * @return {void}
     */
    public extend(name, implementation) {
        this.rules[name] = implementation;
    }

    /**
     * Reset any previous results.
     */
    private reset() {
        this.results = null;
    }

    /**
     * Run the validator's rules against its data using a rule.
     * @param  {*} attributes
     * @param  {String} rule
     * @return {void}
     */
    private validateWithRule(attributes, rules) {
        const validate = this.rules[rules];

        if (!rules) {
            throw new Error("An invalid set of rules was provided.");
        }

        this.results = validate(attributes);
    }

    /**
     * Run the validator's rules against its data using a function.
     * @param  {*} attributes
     * @param  {String} rule
     * @return {void}
     */
    private validateWithFunction(attributes, validate) {
        this.results = validate(attributes);
    }

    /**
     * Run the validator's rules against its data using Joi.
     * @param  {*} attributes
     * @param  {String} rule
     * @return {void}
     */
    private validateWithJoi(attributes, rules) {
        const { error, value } = Engine.validate(attributes, rules);

        this.results = {
            data: value,
            errors: error ? error.details : null,
            passes: !error,
            fails: error,
        };
    }
}

export const validator = new Validator();
