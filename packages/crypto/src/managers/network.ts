import get from "lodash.get";
import * as networks from "../networks";
import { NetworkName } from "../types";

export class NetworkManager {
    public static getAll(): any {
        return networks;
    }

    public static findByName(name: NetworkName): any {
        return get(networks, name.toLowerCase());
    }
}
