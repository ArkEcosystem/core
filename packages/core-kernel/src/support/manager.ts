import { Kernel } from "../contracts";
import { DriverCannotBeResolved } from "../exceptions/container";
import { Identifiers, inject, injectable } from "../ioc";
import { pascalCase } from "../utils";

/**
 * @export
 * @abstract
 * @class Manager
 * @template T
 */
@injectable()
export abstract class Manager<T> {
    /**
     * The application instance.
     *
     * @protected
     * @type {Kernel.Application}
     * @memberof Manager
     */
    @inject(Identifiers.Application)
    protected readonly app: Kernel.Application;

    /**
     * @private
     * @type {string}
     * @memberof Manager
     */
    private defaultDriver: string | undefined;

    /**
     * The array of created "drivers".
     *
     * @private
     * @type {Map<string, T>}
     * @memberof Manager
     */
    private drivers: Map<string, T> = new Map<string, T>();

    /**
     * Create a new manager instance.
     *
     * @memberof Manager
     */
    public constructor() {
        this.defaultDriver = this.getDefaultDriver();
    }

    /**
     * Boot the default driver.
     *
     * @memberof Manager
     */
    public async boot(): Promise<void> {
        await this.createDriver(this.defaultDriver);
    }

    /**
     * Get a driver instance.
     *
     * @param {string} [name]
     * @returns {T}
     * @memberof Manager
     */
    public driver(name?: string): T {
        name = name || this.defaultDriver;

        if (!this.drivers.has(name)) {
            throw new DriverCannotBeResolved(name);
        }

        return this.drivers.get(name);
    }

    /**
     * Register and call a custom driver creator.
     *
     * @param {string} name
     * @param {(app: Kernel.Application) => T} callback
     * @memberof Manager
     */
    public async extend(name: string, callback: (app: Kernel.Application) => Promise<T>): Promise<void> {
        this.drivers.set(name, await callback(this.app));
    }

    /**
     * Set the default driver name.
     *
     * @param {string} name
     * @memberof Manager
     */
    public setDefaultDriver(name: string): void {
        this.defaultDriver = name;
    }

    /**
     * Get all of the created drivers.
     *
     * @returns {T[]}
     * @memberof Manager
     */
    public getDrivers(): T[] {
        return Object.values(this.drivers);
    }

    /**
     * Get the default driver name.
     *
     * @protected
     * @abstract
     * @returns {string}
     * @memberof Manager
     */
    protected abstract getDefaultDriver(): string;

    /**
     * Create a new driver instance.
     *
     * @private
     * @param {string} name
     * @memberof Manager
     */
    private async createDriver(name: string): Promise<void> {
        const creatorFunction = `create${pascalCase(name)}Driver`;

        if (typeof this[creatorFunction] !== "function") {
            throw new Error(`${name} driver is not supported by ${this.constructor.name}.`);
        }

        this.drivers.set(name, await this[creatorFunction](this.app));
    }
}
