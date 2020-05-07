import { Interfaces as BlockInterfaces } from "@arkecosystem/core-crypto";
import { CryptoManager, Interfaces } from "@arkecosystem/crypto";

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

    private cryptoManager: CryptoManager<BlockInterfaces.IBlockData> | undefined;

    /**
     * @returns {Promise<void>}
     * @memberof LoadCryptography
     */
    public async bootstrap(): Promise<void> {
        this.cryptoManager = this.configRepository.hasAll([
            "crypto.genesisBlock",
            "crypto.exceptions",
            "crypto.milestones",
            "crypto.network",
        ])
            ? this.fromConfigRepository()
            : this.fromPreset();

        assert.defined<Interfaces.NetworkConfig<BlockInterfaces.IBlockData>>(this.cryptoManager);

        this.app
            .bind<Interfaces.NetworkConfig<BlockInterfaces.IBlockData>>(Identifiers.CryptoManager)
            .toConstantValue(this.cryptoManager);
    }

    /**
     * @private
     * @memberof LoadCryptography
     */
    private fromPreset(): CryptoManager<BlockInterfaces.IBlockData> {
        return CryptoManager.createFromPreset(this.app.network() as any);
    }

    /**
     * @private
     * @memberof LoadCryptography
     */
    private fromConfigRepository(): CryptoManager<BlockInterfaces.IBlockData> {
        const networkConfig: Interfaces.NetworkConfig<BlockInterfaces.IBlockData> = {
            genesisBlock: this.configRepository.get("crypto.genesisBlock"),
            exceptions: this.configRepository.get("crypto.exceptions"),
            milestones: this.configRepository.get("crypto.milestones"),
            network: this.configRepository.get("crypto.network"),
        };

        return CryptoManager.createFromConfig(networkConfig);
    }
}
