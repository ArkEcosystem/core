import get from "lodash.get";
import set from "lodash.set";

import { NetworkConfig } from "../interfaces/networks";

export class NetworkConfigManager<T> {
    private networkConfig: NetworkConfig<T>;

    public constructor(config: NetworkConfig<T>) {
        this.networkConfig = {
            network: config.network,
            exceptions: config.exceptions,
            milestones: config.milestones,
            genesisBlock: config.genesisBlock,
        };
    }

    public all(): NetworkConfig<T> | undefined {
        return this.networkConfig;
    }

    // TODO: Is this method still necessary?
    // If instances are specific to a network configuration - would it not be easier to instantiate a new Crypto package with other configuration rather than set
    public set<T = any>(key: string, value: T): void {
        set(this.networkConfig, key, value);
    }

    public get<T = any>(key: string): T {
        return get(this.networkConfig, key);
    }
}
