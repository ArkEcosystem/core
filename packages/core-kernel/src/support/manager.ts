import { toStudlyCaps } from "strman";
import { IApplication } from "../contracts/core-kernel";

/**
 * @export
 * @abstract
 * @class Manager
 * @template T
 */
export abstract class Manager<T> {
    /**
     * The application instance.
     *
     * @protected
     * @type {IApplication}
     * @memberof Manager
     */
    protected readonly app: IApplication;

    /**
     * @private
     * @type {string}
     * @memberof Manager
     */
    private defaultDriver: string;

    /**
     * The array of created "drivers".
     *
     * @private
     * @type {Map<string, T>}
     * @memberof Manager
     */
    private drivers: Map<string, T> = new Map<string, T>();

    /**
     * The registered custom driver creators.
     *
     * @private
     * @type {Map<string, (app: IApplication) => Promise<T>>}
     * @memberof Manager
     */
    private customCreators: Map<string, (app: IApplication) => Promise<T>> = new Map<
        string,
        (app: IApplication) => Promise<T>
    >();

    /**
     * Create a new manager instance.
     *
     * @param {{ app:IApplication }} { app }
     * @memberof Manager
     */
    public constructor({ app }: { app: IApplication }) {
        this.app = app;
        this.defaultDriver = this.getDefaultDriver();
    }

    /**
     * Get a driver instance.
     *
     * @param {string} [name]
     * @returns {Promise<T>}
     * @memberof Manager
     */
    public async driver(name?: string): Promise<T> {
        name = name || this.defaultDriver;

        if (this.drivers.has(name)) {
            return this.drivers.get(name);
        }

        if (this.customCreators.has(name)) {
            return this.callCustomCreator(name);
        }

        return this.createDriver(name);
    }

    /**
     * Register a custom driver creator callback.
     *
     * @param {string} name
     * @param {(app: IApplication) => T} callback
     * @memberof Manager
     */
    public extend(name: string, callback: (app: IApplication) => Promise<T>): void {
        this.customCreators.set(name, callback);
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
     * Get the default driver name.
     *
     * @protected
     * @abstract
     * @returns {string}
     * @memberof Manager
     */
    protected abstract getDefaultDriver(): string;

    /**
     * Call a custom driver creator.
     *
     * @private
     * @param {string} name
     * @returns {Promise<T>}
     * @memberof Manager
     */
    private async callCustomCreator(name: string): Promise<T> {
        // tslint:disable-next-line: await-promise
        const value: T = await this.customCreators.get(name)(this.app);
        this.drivers.set(name, value);

        return value;
    }

    /**
     * Create a new driver instance.
     *
     * @private
     * @param {string} name
     * @returns {Promise<T>}
     * @memberof Manager
     */
    private async createDriver(name: string): Promise<T> {
        const creatorFunction: string = `create${toStudlyCaps(name)}Driver`;

        if (typeof this[creatorFunction] !== "function") {
            throw new Error(`${name} driver is not supported by ${this.constructor.name}.`);
        }

        const value: T = await this[creatorFunction](this.app);
        this.drivers.set(name, value);

        return value;
    }
}
