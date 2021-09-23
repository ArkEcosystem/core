import { INetworkConfig } from "../interfaces/networks";
import { NetworkName } from "../types";
export declare class NetworkManager {
    static all(): Record<NetworkName, INetworkConfig>;
    static findByName(name: NetworkName): INetworkConfig;
}
