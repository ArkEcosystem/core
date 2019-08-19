import { Kernel } from "../contracts";
import { LocalAdapter, RemoteAdapter } from "./adapters";

/**
 * @export
 * @class ConfigFactory
 */
export class ConfigFactory {
    /**
     * @static
     * @param {Kernel.IApplication} app
     * @param {string} adapter
     * @returns {Record<string, Kernel.IConfigAdapter>}
     * @memberof ConfigFactory
     */
    public static make(app: Kernel.IApplication, adapter: string): Kernel.IConfigAdapter {
        if (adapter === "remote") {
            return new RemoteAdapter(app);
        }

        return new LocalAdapter(app);
    }
}
