import { Kernel } from "../contracts";
import { DriverCannotBeResolved } from "../exceptions/container";
import { Identifiers, inject, injectable } from "../ioc";
import { pascalCase } from "../utils";

/**
 * @export
 * @abstract
 * @class InstanceManager
 * @template T
 */
@injectable()
export abstract class InstanceManager<T> {
    /**
     * The application instance.
     *
     * @protected
     * @type {Kernel.Application}
     * @memberof InstanceManager
     */
    @inject(Identifiers.Application)
    protected readonly app!: Kernel.Application;

    /**
     * @private
     * @type {string}
     * @memberof InstanceManager
     */
    private defaultDriver: string;

    /**
     * The array of created "drivers".
     *
     * @private
     * @type {Map<string, T>}
     * @memberof InstanceManager
     */
    private drivers: Map<string, T> = new Map<string, T>();

    /**
     * Create a new manager instance.
     *
     * @memberof InstanceManager
     */
    public constructor() {
        this.defaultDriver = this.getDefaultDriver();
    }

    /**
     * Boot the default driver.
     *
     * @memberof InstanceManager
     */
    public async boot(): Promise<void> {
        await this.createDriver(this.defaultDriver);
    }

    /**
     * Get a driver instance.
     *
     * @param {string} [name]
     * @returns {T}
     * @memberof InstanceManager
     */
    public driver(name?: string): T {
        name = name || this.defaultDriver;

        const driver: T | undefined = this.drivers.get(name);

        if (!driver) {
            throw new DriverCannotBeResolved(name);
        }

        return driver;
    }

    /**
     * Register and call a custom driver creator.
     *
     * @param {string} name
     * @param {(app: Kernel.Application) => T} callback
     * @memberof InstanceManager
     */
    public async extend(name: string, callback: (app: Kernel.Application) => Promise<T>): Promise<void> {
        this.drivers.set(name, await callback(this.app));
    }

    /**
     * Set the default driver name.
     *
     * @param {string} name
     * @memberof InstanceManager
     */
    public setDefaultDriver(name: string): void {
        this.defaultDriver = name;
    }

    /**
     * Get all of the created drivers.
     *
     * @returns {T[]}
     * @memberof InstanceManager
     */
    public getDrivers(): T[] {
        return Array.from(this.drivers.values());
    }

    /**
     * Create a new driver instance.
     *
     * @private
     * @param {string} name
     * @memberof InstanceManager
     */
    private async createDriver(name: string): Promise<void> {
        const creatorFunction = `create${pascalCase(name)}Driver`;

        if (typeof this[creatorFunction] !== "function") {
            throw new Error(`${name} driver is not supported by ${this.constructor.name}.`);
        }

        this.drivers.set(name, await this[creatorFunction](this.app));
    }

    /**
     * Get the default driver name.
     *
     * @protected
     * @abstract
     * @returns {string}
     * @memberof InstanceManager
     */
    protected abstract getDefaultDriver(): string;
}
