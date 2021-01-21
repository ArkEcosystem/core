import { AnySchema } from "joi";

import { InputArgument, InputArguments } from "../contracts";

/**
 * @export
 * @class InputDefinition
 */
export class InputDefinition {
    /**
     * @private
     * @type {InputArguments}
     * @memberof InputDefinition
     */
    private readonly arguments: InputArguments = {};

    /**
     * @private
     * @type {InputArguments}
     * @memberof InputDefinition
     */
    private readonly flags: InputArguments = {};

    /**
     * @returns {InputArguments}
     * @memberof InputDefinition
     */
    public getArguments(): InputArguments {
        return this.arguments;
    }

    /**
     * @param {string} name
     * @returns {InputArgument}
     * @memberof Input
     */
    public getArgument(name: string): InputArgument {
        return this.arguments[name];
    }

    /**
     * @param {string} name
     * @param {string} description
     * @param {AnySchema} schema
     * @returns {this}
     * @memberof InputDefinition
     */
    public setArgument(name: string, description: string, schema: AnySchema): this {
        this.arguments[name] = { description, schema };

        return this;
    }

    /**
     * @param {string} name
     * @returns {boolean}
     * @memberof Input
     */
    public hasArgument(name: string): boolean {
        return this.arguments[name] !== undefined;
    }

    /**
     * @returns {InputArguments}
     * @memberof InputDefinition
     */
    public getFlags(): InputArguments {
        return this.flags;
    }

    /**
     * @param {string} name
     * @returns {InputArgument}
     * @memberof Input
     */
    public getFlag(name: string): InputArgument {
        return this.flags[name];
    }

    /**
     * @param {string} name
     * @param {string} description
     * @param {AnySchema} schema
     * @returns {this}
     * @memberof InputDefinition
     */
    public setFlag(name: string, description: string, schema: AnySchema): this {
        this.flags[name] = { description, schema };

        return this;
    }

    /**
     * @param {string} name
     * @returns {boolean}
     * @memberof Input
     */
    public hasFlag(name: string): boolean {
        return this.flags[name] !== undefined;
    }
}
