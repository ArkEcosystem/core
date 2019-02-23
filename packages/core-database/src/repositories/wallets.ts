import { Database } from "@arkecosystem/core-interfaces";
import { orderBy } from "@arkecosystem/utils";
import filterRows from "./utils/filter-rows";
import limitRows from "./utils/limit-rows";

export class WalletsRepository implements Database.IWalletsBusinessRepository {
    /**
     * Create a new wallet repository instance.
     * @param  {DatabaseConnection} databaseService
     */
    public constructor(private databaseServiceProvider: () => Database.IDatabaseService) {}

    /**
     * Get all local wallets.
     * @return {Array}
     */
    public all() {
        return this.databaseServiceProvider().walletManager.allByAddress();
    }

    /**
     * Find all wallets.
     * @param  {{ orderBy?: string }} params
     * @return {Object}
     */
    // @ts-ignore
    public findAll(params: Database.IParameters = {}) {
        const wallets = this.orderBy(params, this.all(), ["rate", "asc"]);

        return {
            rows: limitRows(wallets, params),
            count: wallets.length,
        };
    }

    /**
     * Find all wallets for the given vote.
     * @param  {String} publicKey
     * @param  {Object} params
     * @return {Object}
     */
    // @ts-ignore
    public findAllByVote(publicKey: string, params: Database.IParameters = {}) {
        const wallets = this.all().filter(wallet => wallet.vote === publicKey);

        return {
            rows: limitRows(this.orderBy(params, wallets, ["balance", "desc"]), params),
            count: wallets.length,
        };
    }

    /**
     * Find a wallet by address, public key or username.
     */
    public findById(id: string) {
        return this.all().find(wallet => wallet.address === id || wallet.publicKey === id || wallet.username === id);
    }

    /**
     * Count all wallets.
     */
    public count() {
        return this.all().length;
    }

    /**
     * Find all wallets sorted by balance.
     */
    // @ts-ignore
    public top(params: Database.IParameters = {}) {
        const wallets = this.orderBy(params, this.all(), ["balance", "desc"]);

        return {
            rows: limitRows(wallets, params),
            count: wallets.length,
        };
    }

    /**
     * Search all wallets.
     * @param  {Object} [params]
     * @param  {Number} [params.limit] - Limit the number of results
     * @param  {Number} [params.offset] - Skip some results
     * @param  {Array}  [params.orderBy] - Order of the results
     * @param  {String} [params.address] - Search by address
     * @param  {Array}  [params.addresses] - Search by several addresses
     * @param  {String} [params.publicKey] - Search by publicKey
     * @param  {String} [params.secondPublicKey] - Search by secondPublicKey
     * @param  {String} [params.username] - Search by username
     * @param  {String} [params.vote] - Search by vote
     * @param  {Object} [params.balance] - Search by balance
     * @param  {Number} [params.balance.from] - Search by balance (minimum)
     * @param  {Number} [params.balance.to] - Search by balance (maximum)
     * @param  {Object} [params.voteBalance] - Search by voteBalance
     * @param  {Number} [params.voteBalance.from] - Search by voteBalance (minimum)
     * @param  {Number} [params.voteBalance.to] - Search by voteBalance (maximum)
     * @return {Object}
     */
    public search<T extends Database.IParameters>(params: T) {
        const query: any = {
            exact: ["address", "publicKey", "secondPublicKey", "username", "vote"],
            between: ["balance", "voteBalance"],
        };

        if (params.addresses) {
            // Use the `in` filter instead of `exact` for the `address` field
            if (!params.address) {
                params.address = params.addresses;
                query.exact.shift();
                query.in = ["address"];
            }
            delete params.addresses;
        }

        const wallets = filterRows(this.all(), params, query);

        return {
            rows: limitRows(wallets, params),
            count: wallets.length,
        };
    }

    private orderBy(params, wallets, defaultValue) {
        const [iteratee, order] = params.orderBy ? params.orderBy.split(":") : defaultValue;

        if (iteratee === "balance") {
            wallets = Object.values(wallets).sort((a: any, b: any) => {
                return order === "asc" ? +a.balance.minus(b.balance).toFixed() : +b.balance.minus(a.balance).toFixed();
            });
        } else {
            wallets = orderBy(wallets, [iteratee], [order as "desc" | "asc"]);
        }

        return wallets;
    }
}
