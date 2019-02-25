import { Database } from "@arkecosystem/core-interfaces";
import { delegateCalculator } from "@arkecosystem/core-utils";
import { orderBy } from "@arkecosystem/utils";
import filterRows from "./utils/filter-rows";
import limitRows from "./utils/limit-rows";
import { sortEntries } from "./utils/sort-entries";

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
        this.applyOrder(params);

        const delegates = sortEntries(params, this.getLocalDelegates(), ["rate", "asc"]);

        return {
            rows: limitRows(delegates, params),
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

        this.applyOrder(params);

        let delegates = filterRows(this.getLocalDelegates(), params, query);
        delegates = sortEntries(params, delegates, ["rate", "asc"]);

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

    private applyOrder(params): string {
        const assignOrder = (params, value) => (params.orderBy = value.join(":"));

        if (!params.orderBy) {
            return assignOrder(params, ["rate", "asc"]);
        }

        const orderByMapped = params.orderBy.split(":").map(p => p.toLowerCase());

        if (orderByMapped.length !== 2 || ["desc", "asc"].includes(orderByMapped[1]) !== true) {
            return assignOrder(params, ["rate", "asc"]);
        }

        return assignOrder(params, [this.manipulateIteratee(orderByMapped[0]), orderByMapped[1]]);
    }

    private manipulateIteratee(iteratee): any {
        switch (iteratee) {
            case "votes":
                return "voteBalance";
            case "rank":
                return "rate";
            case "productivity":
                return delegateCalculator.calculateProductivity;
            case "votes":
                return "voteBalance";
            case "approval":
                return delegateCalculator.calculateApproval;
            default:
                return iteratee;
        }
    }
}
