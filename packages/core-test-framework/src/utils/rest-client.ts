import { Utils } from "@arkecosystem/core-kernel";

/**
 * @export
 * @class RestClient
 */
export class RestClient {
    /**
     * @static
     * @param {string} path
     * @param {Utils.HttpOptions} [opts]
     * @returns {Promise<Utils.HttpResponse>}
     * @memberof RestClient
     */
    public static async get(path: string, opts?: Utils.HttpOptions): Promise<Utils.HttpResponse> {
        return Utils.http.get(`http://localhost:4003/api/${path}`, opts);
    }

    /**
     * @static
     * @param {string} path
     * @param {*} body
     * @returns {Promise<Utils.HttpResponse>}
     * @memberof RestClient
     */
    public static async post(path: string, body): Promise<Utils.HttpResponse> {
        return Utils.http.post(`http://localhost:4003/api/${path}`, { body });
    }

    /**
     * @static
     * @param {*} transactions
     * @returns {Promise<Utils.HttpResponse>}
     * @memberof RestClient
     */
    public static async broadcast(transactions): Promise<Utils.HttpResponse> {
        return this.post("transactions", { transactions });
    }
}
