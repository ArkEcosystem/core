import get from "lodash.get";
import * as networks from "../networks";
import { NetworkName } from "./config";

export class NetworkManager {
    /**
     * Get all network types.
     */
    public static getAll(): any {
        return networks;
    }

    /**
     * Find network by name.
     */
    public static findByName(name: NetworkName): any {
        return get(networks, name.toLowerCase());
    }
}
