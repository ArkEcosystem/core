import { NetworkConfig } from "../interfaces/networks";
import * as networks from "../networks";
import { NetworkName } from "../types";

export class NetworkManager {
    public static all(): Record<NetworkName, NetworkConfig> {
        return networks;
    }

    public static findByName(name: NetworkName): NetworkConfig {
        return networks[name.toLowerCase()];
    }
}
