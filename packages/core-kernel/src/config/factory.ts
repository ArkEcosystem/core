import { Kernel } from "../contracts";
import { InvalidConfigurationAdapter } from "../errors";
import { LocalAdapter, RemoteAdapter } from "./adapters";
import { BaseAdapter } from "./adapters/base";

/**
 * @export
 * @class ConfigFactory
 */
export class ConfigFactory {
    /**
     * @static
     * @param {Kernel.IApplication} app
     * @param {string} adapter
     * @returns {Record<string, BaseAdapter>}
     * @memberof ConfigFactory
     */
    public static make(app: Kernel.IApplication, adapter: string): BaseAdapter {
        try {
            if (adapter === "remote") {
                return new RemoteAdapter(app);
            }

            return new LocalAdapter(app);
        } catch (error) {
            throw new InvalidConfigurationAdapter();
        }
    }
}
