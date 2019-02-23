import { Database } from "@arkecosystem/core-interfaces";
import { delegateCalculator } from "@arkecosystem/core-utils";
import { orderBy } from "@arkecosystem/utils";
import filterRows from "./utils/filter-rows";
import limitRows from "./utils/limit-rows";

export class DelegatesRepository implements Database.IDelegatesBusinessRepository {
    /**
     * Create a new delegate repository instance.
     * @param databaseServiceProvider
     */
    public constructor(private databaseServiceProvider: () => Database.IDatabaseService) {}

    /**
     * Get all local delegates.
     */
    public getLocalDelegates() {
        // TODO: What's the diff between this and just calling 'allByUsername'
        return this.databaseServiceProvider()
            .walletManager.allByAddress()
            .filter(wallet => !!wallet.username);
    }

    /**
     * Find all delegates.
     * @param  {Object} params
     * @return {Object}
     */
    public findAll(params: Database.IParameters = {}) {
        const delegates = this.getLocalDelegates();

        const [iteratee, order] = this.__orderBy(params);

        return {
            rows: limitRows(orderBy(delegates, [iteratee], [order as "desc" | "asc"]), params),
            count: delegates.length,
        };
    }

    /**
     * Search all delegates.
     * TODO Currently it searches by username only
     * @param  {Object} [params]
     * @param  {String} [params.username] - Search by username
     * @param  {Array}  [params.usernames] - Search by usernames
     */
    public search(params: Database.IParameters) {
        const query: any = {
            like: ["username"],
        };

        if (params.usernames) {
            if (!params.username) {
                params.username = params.usernames;
                query.like.shift();
                query.in = ["username"];
            }
            delete params.usernames;
        }

        const delegates = filterRows(this.getLocalDelegates(), params, query);

        const [iteratee, order] = this.__orderBy(params);

        return {
            rows: limitRows(orderBy(delegates, [iteratee], [order as "desc" | "asc"]), params),
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
    public async getActiveAtHeight(height: number) {
        const delegates = await this.databaseServiceProvider().getActiveDelegates(height);

        return delegates.map(delegate => {
            const wallet = this.databaseServiceProvider().wallets.findById(delegate.publicKey);

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

        const orderByMapped = params.orderBy.split(":").map(p => p.toLowerCase());
        if (orderByMapped.length !== 2 || ["desc", "asc"].includes(orderByMapped[1]) !== true) {
            return ["rate", "asc"];
        }

        return [this.__manipulateIteratee(orderByMapped[0]), orderByMapped[1]];
    }

    public __manipulateIteratee(iteratee): any {
        switch (iteratee) {
            case "rank":
                return "rate";
            case "productivity":
                return delegateCalculator.calculateProductivity;
            case "approval":
                return delegateCalculator.calculateApproval;
            default:
                return iteratee;
        }
    }
}
