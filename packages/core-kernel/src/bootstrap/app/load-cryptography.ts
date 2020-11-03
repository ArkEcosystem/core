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

        const networkConfig: Interfaces.NetworkConfig | undefined = Managers.configManager.all();

        assert.defined<Interfaces.NetworkConfig>(networkConfig);

        this.app.bind<Interfaces.NetworkConfig>(Identifiers.Crypto).toConstantValue(networkConfig);
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
        const config: Interfaces.NetworkConfig = {
            network: this.configRepository.get<Interfaces.Network>("crypto.network")!,
            exceptions: this.configRepository.get<Interfaces.IExceptions>("crypto.exceptions")!,
            milestones: this.configRepository.get<Array<Record<string, any>>>("crypto.milestones")!,
            genesisBlock: this.configRepository.get<Interfaces.IBlockJson>("crypto.genesisBlock")!,
        };

        Managers.configManager.setConfig(config);
    }
}
