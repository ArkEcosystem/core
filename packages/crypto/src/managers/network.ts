import get from "lodash.get";
import * as networks from "../networks";
import { NetworkName } from "../types";

export class NetworkManager {
    public static getAll() {
        return networks;
    }

    public static findByName(name: NetworkName) {
        return get(networks, name.toLowerCase());
    }
}
