import get from "lodash/get";
import * as networks from "../networks";

export class NetworkManager {
    /**
     * Get all network types.
     * @return {Object}
     */
    public static getAll() {
        return networks;
    }

    /**
     * Find network by token and name.
     * @param  {String} name
     * @param  {String} [token=ark]
     * @return {Object}
     */
    public static findByName(name) {
        return get(networks, name.toLowerCase());
    }
}
