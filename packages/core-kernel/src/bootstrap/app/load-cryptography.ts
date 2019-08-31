import { Interfaces, Managers } from "@arkecosystem/crypto";

import { Identifiers, inject, injectable } from "../../container";
import { Application } from "../../contracts/kernel";
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
    private readonly app: Application;

    /**
     * @returns {Promise<void>}
     * @memberof LoadCryptography
     */
    public async bootstrap(): Promise<void> {
        Managers.configManager.setFromPreset(this.app.network() as any);

        this.app.bind<Interfaces.NetworkConfig>(Identifiers.Crypto).toConstantValue(Managers.configManager.all());
    }
}
