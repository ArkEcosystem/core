import { FailedNetworkDetection } from "../../errors";
import { AbstractBootstrapper } from "../bootstrapper";

/**
 * @export
 * @class LoadNamespace
 */
export class LoadNamespace extends AbstractBootstrapper {
    /**
     * @returns {Promise<void>}
     * @memberof LoadNamespace
     */
    public async bootstrap(): Promise<void> {
        const token: string = this.app.token();
        const network: string = this.app.network();

        if (!token || !network) {
            throw new FailedNetworkDetection();
        }

        this.app.bind("app.namespace", `${token}-${network}`);
        this.app.bind("app.dirPrefix", `${token}/${network}`);
    }
}
