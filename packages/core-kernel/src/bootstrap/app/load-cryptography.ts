import { Interfaces, Managers } from "@arkecosystem/crypto";

import { Application } from "../../contracts/kernel";
import { Identifiers, inject, injectable } from "../../ioc";
import { ConfigRepository } from "../../services/config";
import { assert } from "../../utils";
import { Bootstrapper } from "../interfaces";

/**
 * @export
 * @class LoadCryptography
 * @implements {Bootstrapper}
 */
@injectable()
export class LoadCryptography implements Bootstrapper {
    /**
     * The application instance.
     *
     * @private
     * @type {Application}
     * @memberof Local
     */
    @inject(Identifiers.Application)
    private readonly app!: Application;

    /**
     * The application configuration.
     *
     * @private
     * @type {ConfigRepository}
     * @memberof LoadCryptography
     */
    @inject(Identifiers.ConfigRepository)
    private readonly configRepository!: ConfigRepository;

    /**
     * @returns {Promise<void>}
     * @memberof LoadCryptography
     */
    public async bootstrap(): Promise<void> {
        this.configRepository.hasAll([
            "crypto.genesisBlock",
            "crypto.exceptions",
            "crypto.milestones",
            "crypto.network",
        ])
            ? this.fromConfigRepository()
            : this.fromPreset();

        this.app
            .bind<Interfaces.NetworkConfig>(Identifiers.Crypto)
            .toConstantValue(assert.defined(Managers.configManager.all()));
    }

    /**
     * @private
     * @memberof LoadCryptography
     */
    private fromPreset(): void {
        Managers.configManager.setFromPreset(this.app.network() as any);
    }

    /**
     * @private
     * @memberof LoadCryptography
     */
    private fromConfigRepository(): void {
        Managers.configManager.set("genesisBlock", this.configRepository.get("crypto.genesisBlock"));
        Managers.configManager.set("exceptions", this.configRepository.get("crypto.exceptions"));
        Managers.configManager.set("milestones", this.configRepository.get("crypto.milestones"));
        Managers.configManager.set("network", this.configRepository.get("crypto.network"));
    }
}
