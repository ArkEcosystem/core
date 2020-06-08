import { Blocks, CryptoSuite, Validation } from "@arkecosystem/core-crypto";
import { IBlockData } from "@arkecosystem/core-crypto/dist/interfaces";
import { Interfaces } from "@arkecosystem/crypto";

import { Application } from "../../contracts/kernel";
import { Identifiers, inject, injectable } from "../../ioc";
import { ConfigRepository } from "../../services/config";
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

    private cryptoManager!: CryptoSuite.CryptoManager;
    private transactionManager!: CryptoSuite.TransactionManager;
    private blockFactory!: Blocks.BlockFactory;

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

        const validator = Validation.Validator.make(this.cryptoManager); // TODO: this should be configurable

        this.transactionManager = new CryptoSuite.TransactionManager(this.cryptoManager, validator);

        this.blockFactory = new Blocks.BlockFactory(this.cryptoManager, this.transactionManager, validator);

        this.app.rebind<CryptoSuite.CryptoManager>(Identifiers.CryptoManager).toConstantValue(this.cryptoManager);

        this.app
            .rebind<CryptoSuite.TransactionManager>(Identifiers.TransactionManager)
            .toConstantValue(this.transactionManager);

        this.app.rebind<Blocks.BlockFactory>(Identifiers.BlockFactory).toConstantValue(this.blockFactory);
    }

    /**
     * @private
     * @memberof LoadCryptography
     */
    private fromPreset(): CryptoSuite.CryptoManager {
        return CryptoSuite.CryptoManager.createFromPreset(this.app.network() as any);
    }

    /**
     * @private
     * @memberof LoadCryptography
     */
    private fromConfigRepository(): CryptoSuite.CryptoManager {
        const networkConfig: Interfaces.NetworkConfig<IBlockData> = {
            genesisBlock: this.configRepository.get("crypto.genesisBlock"),
            exceptions: this.configRepository.get("crypto.exceptions"),
            milestones: this.configRepository.get("crypto.milestones"),
            network: this.configRepository.get("crypto.network"),
        };

        return CryptoSuite.CryptoManager.createFromConfig(networkConfig);
    }
}
