import { delegateCalculator } from "@arkecosystem/core-utils";
import orderBy from "lodash/orderBy";
import limitRows from "./utils/limit-rows";

export class DelegatesRepository {
    /**
     * Create a new delegate repository instance.
     * @param  {ConnectionInterface} connection
     */
    public constructor(public connection) {}

    /**
     * Get all local delegates.
     * @return {Array}
     */
    public getLocalDelegates() {
        return this.connection.walletManager.all().filter(wallet => !!wallet.username);
    }

    /**
     * Find all delegates.
     * @param  {Object} params
     * @return {Object}
     */
    public findAll(params: { orderBy?: string } = {}) {
        const delegates = this.getLocalDelegates();

        const [iteratee, order] = this.__orderBy(params);

        return {
            rows: limitRows(orderBy(delegates, iteratee, order as "desc" | "asc"), params),
            count: delegates.length,
        };
    }

    /**
     * Paginate all delegates.
     * @param  {Object} params
     * @return {Object}
     */
    public paginate(params) {
        return this.findAll(params);
    }

    /**
     * Search all delegates.
     * TODO Currently it searches by username only
     * @param  {Object} [params]
     * @param  {String} [params.username] - Search by username
     * @return {Object}
     */
    public search(params) {
        let delegates = this.getLocalDelegates();
        if (params.hasOwnProperty("username")) {
            delegates = delegates.filter(delegate => delegate.username.indexOf(params.username) > -1);
        }

        if (params.orderBy) {
            const orderByField = params.orderBy.split(":")[0];
            const orderByDirection = params.orderBy.split(":")[1] || "desc";

            delegates = delegates.sort((a, b) => {
                if (orderByDirection === "desc" && a[orderByField] < b[orderByField]) {
                    return -1;
                }

                if (orderByDirection === "asc" && a[orderByField] > b[orderByField]) {
                    return 1;
                }

                return 0;
            });
        }

        return {
            rows: limitRows(delegates, params),
            count: delegates.length,
        };
    }

    /**
     * Find a delegate.
     * @param  {String} id
     * @return {Object}
     */
    public findById(id) {
        return this.getLocalDelegates().find(a => a.address === id || a.publicKey === id || a.username === id);
    }

    /**
     * Find all active delegates at height.
     * @param  {Number} height
     * @return {Array}
     */
    public getActiveAtHeight(height) {
        const delegates = this.connection.getActiveDelegates(height);

        return delegates.map(delegate => {
            const wallet = this.connection.wallets.findById(delegate.publicKey);

            return {
                username: wallet.username,
                approval: delegateCalculator.calculateApproval(delegate, height),
                productivity: delegateCalculator.calculateProductivity(wallet),
            };
        });
    }

    public __orderBy(params): string[] {
        if (!params.orderBy) {
            return ["rate", "asc"];
        }

        const orderBy = params.orderBy.split(":").map(p => p.toLowerCase());
        if (orderBy.length !== 2 || ["desc", "asc"].includes(orderBy[1]) !== true) {
            return ["rate", "asc"];
        }

        return orderBy[0] === "rank" ? ["rate", orderBy[1]] : orderBy;
    }
}
