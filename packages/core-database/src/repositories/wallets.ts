import { Bignum } from "@arkecosystem/crypto";
import orderBy from "lodash/orderBy";
import filterRows from "./utils/filter-rows";
import limitRows from "./utils/limit-rows";

export class WalletsRepository {
    /**
     * Create a new wallet repository instance.
     * @param  {ConnectionInterface} connection
     */
    public constructor(public connection) {}

    /**
     * Get all local wallets.
     * @return {Array}
     */
    public all() {
        return this.connection.walletManager.all();
    }

    /**
     * Find all wallets.
     * @param  {{ orderBy?: string }} params
     * @return {Object}
     */
    public findAll(params: { orderBy?: string } = {}) {
        const wallets = this.all();

        const [iteratee, order] = params.orderBy ? params.orderBy.split(":") : ["rate", "asc"];

        return {
            rows: limitRows(orderBy(wallets, iteratee, order as "desc" | "asc"), params),
            count: wallets.length,
        };
    }

    /**
     * Find all wallets for the given vote.
     * @param  {String} publicKey
     * @param  {Object} params
     * @return {Object}
     */
    public findAllByVote(publicKey, params = {}) {
        const wallets = this.all().filter(wallet => wallet.vote === publicKey);

        return {
            rows: limitRows(wallets, params),
            count: wallets.length,
        };
    }

    /**
     * Find a wallet by address, public key or username.
     * @param  {Number} id
     * @return {Object}
     */
    public findById(id) {
        return this.all().find(wallet => wallet.address === id || wallet.publicKey === id || wallet.username === id);
    }

    /**
     * Count all wallets.
     * @return {Number}
     */
    public count() {
        return this.all().length;
    }

    /**
     * Find all wallets sorted by balance.
     * @param  {Object}  params
     * @return {Object}
     */
    public top(params = {}) {
        const wallets = Object.values(this.all()).sort((a: any, b: any) => +b.balance.minus(a.balance).toFixed());

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
    public search(params) {
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
}
