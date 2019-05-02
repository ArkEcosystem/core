import { Database, State } from "@arkecosystem/core-interfaces";
import filterRows from "./utils/filter-rows";
import limitRows from "./utils/limit-rows";
import { sortEntries } from "./utils/sort-entries";

export class WalletsBusinessRepository implements Database.IWalletsBusinessRepository {
    public constructor(private readonly databaseServiceProvider: () => Database.IDatabaseService) {}

    public all(): State.IWallet[] {
        return this.databaseServiceProvider().walletManager.allByAddress();
    }

    public findAll(params: Database.IParameters = {}): Database.IWalletsPaginated {
        this.applyOrder(params);

        const wallets = sortEntries(params, this.all(), ["rate", "asc"]);

        return {
            rows: limitRows(wallets, params),
            count: wallets.length,
        };
    }

    public findAllByVote(publicKey: string, params: Database.IParameters = {}): Database.IWalletsPaginated {
        this.applyOrder(params);

        const wallets = this.all().filter(wallet => wallet.vote === publicKey);

        return {
            rows: limitRows(sortEntries(params, wallets, ["balance", "desc"]), params),
            count: wallets.length,
        };
    }

    public findById(id: string): State.IWallet {
        return this.all().find(wallet => wallet.address === id || wallet.publicKey === id || wallet.username === id);
    }

    public count(): number {
        return this.all().length;
    }

    public top(params: Database.IParameters = {}): Database.IWalletsPaginated {
        this.applyOrder(params);

        const wallets = sortEntries(params, this.all(), ["balance", "desc"]);

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
     * @param  {String} [params.orderBy] - Order of the results
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
    public search<T extends Database.IParameters>(params: T): Database.IWalletsPaginated {
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

        this.applyOrder(params);

        let wallets = filterRows(this.all(), params, query);
        wallets = sortEntries(params, wallets, ["balance", "desc"]);

        return {
            rows: limitRows(wallets, params),
            count: wallets.length,
        };
    }

    private applyOrder(params): [string, string] {
        const assignOrder = (params, value) => (params.orderBy = value);

        if (!params.orderBy) {
            return assignOrder(params, ["balance", "desc"]);
        }

        const orderByMapped = params.orderBy.split(":").map(p => p.toLowerCase());

        if (orderByMapped.length !== 2 || ["desc", "asc"].includes(orderByMapped[1]) !== true) {
            return assignOrder(params, ["balance", "desc"]);
        }

        return assignOrder(params, orderByMapped);
    }
}
