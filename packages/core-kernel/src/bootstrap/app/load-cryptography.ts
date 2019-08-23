import { Managers } from "@arkecosystem/crypto";
import { AbstractBootstrapper } from "../bootstrapper";

/**
 * @export
 * @class LoadCryptography
 * @extends {AbstractBootstrapper}
 */
export class LoadCryptography extends AbstractBootstrapper {
    /**
     * @returns {Promise<void>}
     * @memberof LoadCryptography
     */
    public async bootstrap(): Promise<void> {
        Managers.configManager.setFromPreset(this.app.network() as any);

        this.app.bind("crypto.network", Managers.configManager.all());
        this.app.bind("crypto.exceptions", Managers.configManager.get("exceptions"));
        this.app.bind("crypto.milestones", Managers.configManager.get("milestones"));
        this.app.bind("crypto.genesisBlock", Managers.configManager.get("genesisBlock"));
    }
}
