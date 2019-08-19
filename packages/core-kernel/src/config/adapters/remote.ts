import { Kernel } from "../../contracts";

/**
 * @export
 * @class RemoteAdapter
 * @implements {Kernel.IConfigAdapter}
 */
export class RemoteAdapter implements Kernel.IConfigAdapter {
    /**
     * @param {Kernel.IApplication} app
     * @memberof BaseAdapter
     */
    public constructor(protected readonly app: Kernel.IApplication) {}

    /**
     * @returns {Promise<void>}
     * @memberof RemoteAdapter
     */
    public async loadConfiguration(): Promise<void> {
        // @TODO
    }

    /**
     * @returns {Promise<void>}
     * @memberof RemoteAdapter
     */
    public async loadEnvironmentVariables(): Promise<void> {
        // @TODO
    }
}
