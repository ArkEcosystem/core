import { Managers } from "@arkecosystem/crypto";
import { Kernel } from "../contracts";

/**
 * @export
 * @class LoadCryptography
 */
export class LoadCryptography {
    /**
     * @param {Kernel.IApplication} app
     * @returns {Promise<void>}
     * @memberof LoadCryptography
     */
    public async bootstrap(app: Kernel.IApplication): Promise<void> {
        this.configure(app, Managers.NetworkManager.findByName(app.network() as any));
    }

    /**
     * @private
     * @param {Kernel.IApplication} app
     * @param {*} config
     * @memberof LoadCryptography
     */
    private configure(app: Kernel.IApplication, config: any): void {
        Managers.configManager.setConfig(config);

        app.bind("crypto.network", Managers.configManager.all());
        app.bind("crypto.exceptions", Managers.configManager.get("exceptions"));
        app.bind("crypto.milestones", Managers.configManager.get("milestones"));
        app.bind("crypto.genesisBlock", Managers.configManager.get("genesisBlock"));
    }
}
