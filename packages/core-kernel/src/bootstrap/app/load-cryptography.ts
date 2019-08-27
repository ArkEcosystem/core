import { Managers, Interfaces } from "@arkecosystem/crypto";
import { Application } from "../../contracts/kernel";
import { Bootstrapper } from "../interfaces";
import { injectable, inject } from "../../container";

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
    @inject("app")
    private readonly app: Application;

    /**
     * @returns {Promise<void>}
     * @memberof LoadCryptography
     */
    public async bootstrap(): Promise<void> {
        Managers.configManager.setFromPreset(this.app.network() as any);

        this.app.bind<Interfaces.NetworkConfig>("crypto.network").toConstantValue(Managers.configManager.all());
        this.app.bind<string>("crypto.exceptions").toConstantValue(Managers.configManager.get("exceptions"));
        this.app.bind<string>("crypto.milestones").toConstantValue(Managers.configManager.get("milestones"));
        this.app.bind<string>("crypto.genesisBlock").toConstantValue(Managers.configManager.get("genesisBlock"));
    }
}
