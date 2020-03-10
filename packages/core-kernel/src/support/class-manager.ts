import { Kernel } from "../contracts";
import { Identifiers, inject, injectable } from "../ioc";
import { pascalCase } from "../utils";

/**
 * @export
 * @class ClassManager
 */
@injectable()
export abstract class ClassManager {
    /**
     * The application instance.
     *
     * @protected
     * @type {Kernel.Application}
     * @memberof ClassManager
     */
    @inject(Identifiers.Application)
    protected readonly app!: Kernel.Application;

    /**
     * @private
     * @type {string}
     * @memberof ClassManager
     */
    private defaultDriver: string;

    /**
     * Create a new manager instance.
     *
     * @memberof ClassManager
     */
    public constructor() {
        this.defaultDriver = this.getDefaultDriver();
    }

    /**
     * Get a driver instance.
     *
     * @param {string} [name]
     * @returns {Class}
     * @memberof ClassManager
     */
    public async driver<T>(name?: string): Promise<T> {
        return this.createDriver<T>(name || this.defaultDriver);
    }

    /**
     * Set the default driver name.
     *
     * @param {string} name
     * @memberof ClassManager
     */
    public setDefaultDriver(name: string): void {
        this.defaultDriver = name;
    }

    /**
     * Create a new driver instance.
     *
     * @private
     * @param {string} name
     * @memberof ClassManager
     */
    private async createDriver<T>(name: string): Promise<T> {
        const creatorFunction = `create${pascalCase(name)}Driver`;

        if (typeof this[creatorFunction] !== "function") {
            throw new Error(`${name} driver is not supported by ${this.constructor.name}.`);
        }

        return this[creatorFunction]();
    }

    /**
     * Get the default driver name.
     *
     * @protected
     * @abstract
     * @returns {string}
     * @memberof ClassManager
     */
    protected abstract getDefaultDriver(): string;
}
