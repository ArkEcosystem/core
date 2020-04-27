import { NetworkConfig } from "../interfaces/networks";
import * as networks from "../networks";
import { NetworkName } from "../types";

export class NetworkManager {
    public static all<T>(): Record<NetworkName, NetworkConfig<T>> {
        // @ts-ignore - the newly generated unitnet doesn't match the old configs because it has things like a nonce field
        return (networks as unknown) as Record<NetworkName, NetworkConfig>;
    }

    public static findByName<T>(name: NetworkName): NetworkConfig<T> {
        return networks[name.toLowerCase()];
    }
}
