import { INetworkConfig } from "../interfaces/networks";
import * as networks from "../networks";
import { NetworkName } from "../types";

export class NetworkManager {
    public static all(): Record<NetworkName, INetworkConfig> {
        return networks;
    }

    public static findByName(name: NetworkName): INetworkConfig {
        return networks[name.toLowerCase()];
    }
}
