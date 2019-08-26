import { Managers, Interfaces } from "@arkecosystem/crypto";
import { IApplication } from "../../contracts/kernel";
import { IBootstrapper } from "../interfaces";
import { injectable, inject } from "../../ioc";

/**
 * @export
 * @class LoadCryptography
 * @implements {IBootstrapper}
 */
@injectable()
export class LoadCryptography implements IBootstrapper {
    /**
     * The application instance.
     *
     * @private
     * @type {IApplication}
     * @memberof Local
     */
    @inject("app")
    private readonly app: IApplication;

    /**
     * @returns {Promise<void>}
     * @memberof LoadCryptography
     */
    public async bootstrap(): Promise<void> {
        Managers.configManager.setFromPreset(this.app.network() as any);

        this.app.ioc.bind<Interfaces.INetworkConfig>("crypto.network").toConstantValue(Managers.configManager.all());
        this.app.ioc.bind<string>("crypto.exceptions").toConstantValue(Managers.configManager.get("exceptions"));
        this.app.ioc.bind<string>("crypto.milestones").toConstantValue(Managers.configManager.get("milestones"));
        this.app.ioc.bind<string>("crypto.genesisBlock").toConstantValue(Managers.configManager.get("genesisBlock"));
    }
}
