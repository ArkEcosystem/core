import { NetworkCannotBeDetermined } from "../../exceptions/config";
import { AbstractBootstrapper } from "../bootstrapper";

/**
 * @export
 * @class RegisterBaseNamespace
 * @extends {AbstractBootstrapper}
 */
export class RegisterBaseNamespace extends AbstractBootstrapper {
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

        this.app.bind("app.namespace", `${token}-${network}`);
        this.app.bind("app.dirPrefix", `${token}/${network}`);
    }
}
