import { Application } from "../application";
import { InputValue, InputValues } from "../contracts";
import { Identifiers, inject, injectable } from "../ioc";
import { InputDefinition } from "./definition";
import { InputParser } from "./parser";
import { InputValidator } from "./validator";

/**
 * @class Input
 */
@injectable()
export class Input {
    /**
     * @private
     * @type {Application}
     * @memberof ComponentFactory
     */
    @inject(Identifiers.Application)
    protected readonly app!: Application;

    /**
     * @private
     * @type {InputValidator}
     * @memberof ComponentFactory
     */
    @inject(Identifiers.InputValidator)
    protected readonly validator!: InputValidator;

    /**
     * The parsed input arguments.
     *
     * @type {InputArgument}
     * @memberof Input
     */
    public args: InputValues = {};

    /**
     * The parsed input flags.
     *
     * @type {InputArgument}
     * @memberof Input
     */
    public flags: InputValues = {};

    /**
     * Indicates whether the CLI should be interactive, i.e. show prompts.
     *
     * @type {boolean}
     * @memberof Input
     */
    public interactive: boolean = true;

    /**
     * The raw input arguments.
     *
     * @private
     * @type {InputArgument}
     * @memberof Input
     */
    private definition!: InputDefinition;

    /**
     * The raw input arguments.
     *
     * @private
     * @type {InputArgument}
     * @memberof Input
     */
    private rawArgs: string[] = [];

    /**
     * The raw input flags.
     *
     * @private
     * @type {InputArgument}
     * @memberof Input
     */
    private rawFlags: object = {};

    /**
     * Parse the command line arguments.
     *
     * @param {string[]} argv
     * @param {InputDefinition} definition
     * @memberof Input
     */
    public parse(argv: string[], definition: InputDefinition): void {
        this.definition = definition;

        const { args, flags } = InputParser.parseArgv(argv);

        this.rawArgs = args;
        this.rawFlags = flags;
    }

    /**
     * Bind the command line arguments.
     *
     * @memberof Input
     */
    public bind(): void {
        const keys: string[] = Object.keys(this.definition.getArguments());
        const values: string[] = [...this.rawArgs].slice(1);

        for (let i = 0; i < keys.length; i++) {
            this.args[keys[i]] = values[i];
        }

        this.flags = this.rawFlags;
    }

    /**
     * Validate the arguments and flags.
     *
     * @memberof Input
     */
    public validate(): void {
        const definitionToSchema = (definition: InputValues): object => {
            const schema: object = {};

            for (const [key, value] of Object.entries(definition)) {
                schema[key] = value.schema;
            }

            return schema;
        };

        if (Object.keys(this.args).length > 0) {
            this.args = this.validator.validate(this.args, definitionToSchema(this.definition.getArguments()));
        }

        this.flags = this.validator.validate(this.flags, definitionToSchema(this.definition.getFlags()));
    }

    /**
     * Returns all the given arguments merged with the default values.
     *
     * @param {object} [values]
     * @returns
     * @memberof Input
     */
    public getArguments(values?: object) {
        return values ? { ...values, ...this.args } : this.args;
    }

    /**
     * Returns the argument value for a given argument name.
     *
     * @param {string} name
     * @returns {InputValue}
     * @memberof Input
     */
    public getArgument(name: string): InputValue {
        return this.args[name];
    }

    /**
     * Sets an argument value by name.
     *
     * @param {string} name
     * @param {InputValue} value
     * @memberof Input
     */
    public setArgument(name: string, value: InputValue): void {
        this.args[name] = value;
    }

    /**
     * Returns true if an argument exists by name or position.
     *
     * @param {string} name
     * @returns {boolean}
     * @memberof Input
     */
    public hasArgument(name: string): boolean {
        return this.args[name] !== undefined;
    }

    /**
     * Returns all the given flags merged with the default values.
     *
     * @param {object} [values]
     * @returns
     * @memberof Input
     */
    public getFlags(values?: object) {
        return values ? { ...values, ...this.flags } : this.flags;
    }

    /**
     * Returns the flag value for a given flag name.
     *
     * @param {string} name
     * @returns {InputValue}
     * @memberof Input
     */
    public getFlag<T = string>(name: string): InputValue {
        return this.flags[name];
    }

    /**
     * Sets a flag value by name.
     *
     * @param {string} name
     * @param {InputValue} value
     * @memberof Input
     */
    public setFlag(name: string, value: InputValue): void {
        this.flags[name] = value;
    }

    /**
     * Returns true if a flag exists by name.
     *
     * @param {string} name
     * @returns {boolean}
     * @memberof Input
     */
    public hasFlag(name: string): boolean {
        return this.flags[name] !== undefined;
    }

    /**
     * @returns {boolean}
     * @memberof Input
     */
    public isInteractive(): boolean {
        return this.getFlag("interaction");
    }
}
