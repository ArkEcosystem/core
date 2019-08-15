import { Kernel } from "../../contracts";

/**
 * @export
 * @abstract
 * @class BaseAdapter
 */
export abstract class BaseAdapter {
    /**
     * @param {Kernel.IApplication} app
     * @memberof BaseAdapter
     */
    public constructor(protected readonly app: Kernel.IApplication) {}

    /**
     * @abstract
     * @returns {Promise<void>}
     * @memberof BaseAdapter
     */
    public abstract async loadConfiguration(): Promise<void>;

    /**
     * @abstract
     * @returns {Promise<void>}
     * @memberof BaseAdapter
     */
    public abstract async loadEnvironmentVariables(): Promise<void>;
}
