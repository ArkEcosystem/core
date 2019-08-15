import { BaseAdapter } from "./base";

/**
 * @export
 * @class RemoteAdapter
 * @extends {BaseAdapter}
 */
export class RemoteAdapter extends BaseAdapter {
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
