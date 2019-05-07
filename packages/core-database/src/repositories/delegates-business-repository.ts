import { Database } from "@arkecosystem/core-interfaces";
import { delegateCalculator, hasSomeProperty } from "@arkecosystem/core-utils";
import filterRows from "./utils/filter-rows";
import limitRows from "./utils/limit-rows";
import { sortEntries } from "./utils/sort-entries";

type CallbackFunctionVariadicVoidReturn = (...args: any[]) => void;

export class DelegatesBusinessRepository implements Database.IDelegatesBusinessRepository {
    /**
     * Create a new delegate repository instance.
     * @param databaseServiceProvider
     */
    public constructor(private databaseServiceProvider: () => Database.IDatabaseService) {}

    /**
     * Get all local delegates.
     * @param  {Object} params
     * @return {Object}
     */
    public getLocalDelegates(params: Database.IParameters = {}) {
        let delegates = this.databaseServiceProvider().walletManager.allByUsername();

        const manipulators = {
            approval: delegateCalculator.calculateApproval,
            forgedTotal: delegateCalculator.calculateForgedTotal,
        };

        if (hasSomeProperty(params, Object.keys(manipulators))) {
            delegates = delegates.map(delegate => {
                for (const [prop, method] of Object.entries(manipulators)) {
                    if (params.hasOwnProperty(prop)) {
                        delegate[prop] = method(delegate);
                    }
                }

                return delegate;
            });
        }

        return delegates;
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
     * TODO Search by last block
     * @param  {Object} [params]
     * @param  {Number} [params.limit] - Limit the number of results
     * @param  {Number} [params.offset] - Skip some results
     * @param  {String} [params.orderBy] - Order of the results
     * @param  {String} [params.address] - Search by address
     * @param  {String} [params.publicKey] - Search by publicKey
     * @param  {String} [params.username] - Search by username
     * @param  {Array}  [params.usernames] - Search by usernames
     * @param  {Object} [params.approval] - Search by approval
     * @param  {Number} [params.approval.from] - Search by approval (minimum)
     * @param  {Number} [params.approval.to] - Search by approval (maximum)
     * @param  {Object} [params.forgedFees] - Search by forgedFees
     * @param  {Number} [params.forgedFees.from] - Search by forgedFees (minimum)
     * @param  {Number} [params.forgedFees.to] - Search by forgedFees (maximum)
     * @param  {Object} [params.forgedRewards] - Search by forgedRewards
     * @param  {Number} [params.forgedRewards.from] - Search by forgedRewards (minimum)
     * @param  {Number} [params.forgedRewards.to] - Search by forgedRewards (maximum)
     * @param  {Object} [params.forgedTotal] - Search by forgedTotal
     * @param  {Number} [params.forgedTotal.from] - Search by forgedTotal (minimum)
     * @param  {Number} [params.forgedTotal.to] - Search by forgedTotal (maximum)
     * @param  {Object} [params.producedBlocks] - Search by producedBlocks
     * @param  {Number} [params.producedBlocks.from] - Search by producedBlocks (minimum)
     * @param  {Number} [params.producedBlocks.to] - Search by producedBlocks (maximum)
     * @param  {Object} [params.voteBalance] - Search by voteBalance
     * @param  {Number} [params.voteBalance.from] - Search by voteBalance (minimum)
     * @param  {Number} [params.voteBalance.to] - Search by voteBalance (maximum)
     */
    public search(params: Database.IParameters) {
        const query: any = {
            exact: ["address", "publicKey"],
            like: ["username"],
            between: ["approval", "forgedFees", "forgedRewards", "forgedTotal", "producedBlocks", "voteBalance"],
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

        let delegates = filterRows(this.getLocalDelegates(params), params, query);
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

    private applyOrder(params): [CallbackFunctionVariadicVoidReturn | string, string] {
        const assignOrder = (params, value) => (params.orderBy = value);

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
            case "approval":
                return delegateCalculator.calculateApproval;
            case "forgedTotal":
                return delegateCalculator.calculateForgedTotal;
            case "rank":
                return "rate";
            case "votes":
                return "voteBalance";
            default:
                return iteratee;
        }
    }
}
