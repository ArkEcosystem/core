import { NetworkCannotBeDetermined } from "../../exceptions/config";
import { Application } from "../../contracts/kernel";
import { Bootstrapper } from "../interfaces";
import { injectable, inject } from "../../container";

/**
 * @export
 * @class RegisterBaseNamespace
 * @implements {Bootstrapper}
 */
@injectable()
export class RegisterBaseNamespace implements Bootstrapper {
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
     * @memberof RegisterBaseNamespace
     */
    public async bootstrap(): Promise<void> {
        const token: string = this.app.token();
        const network: string = this.app.network();

        if (!token || !network) {
            throw new NetworkCannotBeDetermined();
        }

        this.app.bind<string>("app.namespace").toConstantValue(`${token}-${network}`);
        this.app.bind<string>("app.dirPrefix").toConstantValue(`${token}/${network}`);
    }
}
