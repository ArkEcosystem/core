import { NetworkCannotBeDetermined } from "../../exceptions/config";
import { IApplication } from "../../contracts/kernel";
import { IBootstrapper } from "../interfaces";
import { injectable, inject } from "../../ioc";

/**
 * @export
 * @class RegisterBaseNamespace
 * @implements {IBootstrapper}
 */
@injectable()
export class RegisterBaseNamespace implements IBootstrapper {
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
     * @memberof RegisterBaseNamespace
     */
    public async bootstrap(): Promise<void> {
        const token: string = this.app.token();
        const network: string = this.app.network();

        if (!token || !network) {
            throw new NetworkCannotBeDetermined();
        }

        this.app.ioc.bind<string>("app.namespace").toConstantValue(`${token}-${network}`);
        this.app.ioc.bind<string>("app.dirPrefix").toConstantValue(`${token}/${network}`);
    }
}
