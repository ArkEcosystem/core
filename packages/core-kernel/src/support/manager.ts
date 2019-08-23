import { toStudlyCaps } from "strman";
import { IApplication } from "../contracts/core-kernel";
import { FailedDriverResolution } from "../errors";

/**
 * @export
 * @abstract
 * @class AbstractManager
 * @template T
 */
export abstract class AbstractManager<T> {
    /**
     * The application instance.
     *
     * @protected
     * @type {IApplication}
     * @memberof AbstractManager
     */
    protected readonly app: IApplication;

    /**
     * @private
     * @type {string}
     * @memberof AbstractManager
     */
    private defaultDriver: string | undefined;

    /**
     * The array of created "drivers".
     *
     * @private
     * @type {Map<string, T>}
     * @memberof AbstractManager
     */
    private drivers: Map<string, T> = new Map<string, T>();

    /**
     * Create a new manager instance.
     *
     * @param {{ app:IApplication }} { app }
     * @memberof AbstractManager
     */
    public constructor({ app }: { app: IApplication }) {
        this.app = app;
        this.defaultDriver = this.getDefaultDriver();
    }

    /**
     * Boot the default driver.
     *
     * @memberof AbstractManager
     */
    public async boot(): Promise<void> {
        await this.createDriver(this.defaultDriver);
    }

    /**
     * Get a driver instance.
     *
     * @param {string} [name]
     * @returns {T}
     * @memberof AbstractManager
     */
    public driver(name?: string): T {
        name = name || this.defaultDriver;

        if (!this.drivers.has(name)) {
            throw new FailedDriverResolution(name);
        }

        return this.drivers.get(name);
    }

    /**
     * Register and call a custom driver creator.
     *
     * @param {string} name
     * @param {(app: IApplication) => T} callback
     * @memberof AbstractManager
     */
    public async extend(name: string, callback: (app: IApplication) => Promise<T>): Promise<void> {
        this.drivers.set(name, await callback(this.app));
    }

    /**
     * Set the default driver name.
     *
     * @param {string} name
     * @memberof AbstractManager
     */
    public setDefaultDriver(name: string): void {
        this.defaultDriver = name;
    }

    /**
     * Get all of the created drivers.
     *
     * @returns {T[]}
     * @memberof AbstractManager
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
     * @memberof AbstractManager
     */
    protected abstract getDefaultDriver(): string;

    /**
     * Create a new driver instance.
     *
     * @private
     * @param {string} name
     * @memberof AbstractManager
     */
    private async createDriver(name: string): Promise<void> {
        const creatorFunction: string = `create${toStudlyCaps(name)}Driver`;

        if (typeof this[creatorFunction] !== "function") {
            throw new Error(`${name} driver is not supported by ${this.constructor.name}.`);
        }

        this.drivers.set(name, await this[creatorFunction](this.app));
    }
}
