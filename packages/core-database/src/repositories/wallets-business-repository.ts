import { Database } from "@arkecosystem/core-interfaces";
import filterRows from "./utils/filter-rows";
import limitRows from "./utils/limit-rows";
import { sortEntries } from "./utils/sort-entries";

export class WalletsBusinessRepository implements Database.IWalletsBusinessRepository {
    public constructor(private readonly databaseServiceProvider: () => Database.IDatabaseService) {}

    public search(params: Database.IParameters = {}): Database.IWalletsPaginated {
        const query: Record<string, string[]> = {
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

        let wallets: Database.IWallet[] = filterRows(
            this.databaseServiceProvider().walletManager.allByAddress(),
            params,
            query,
        );
        wallets = sortEntries(params, wallets, ["balance", "desc"]);

        return {
            rows: limitRows(wallets, params),
            count: wallets.length,
        };
    }

    // @TODO: simplify this
    public findAllByVote(publicKey: string, params: Database.IParameters = {}): Database.IWalletsPaginated {
        this.applyOrder(params);

        const wallets: Database.IWallet[] = this.search().rows.filter(wallet => wallet.vote === publicKey);

        return {
            rows: limitRows(sortEntries(params, wallets, ["balance", "desc"]), params),
            count: wallets.length,
        };
    }

    // @TODO: simplify this
    public findById(id: string): Database.IWallet {
        return this.search().rows.find(
            wallet => wallet.address === id || wallet.publicKey === id || wallet.username === id,
        );
    }

    public count(): number {
        return this.search().count;
    }

    // @TODO: simplify this
    public top(params: Database.IParameters = {}): Database.IWalletsPaginated {
        this.applyOrder(params);

        const wallets: Database.IWallet[] = sortEntries(params, this.search().rows, ["balance", "desc"]);

        return {
            rows: limitRows(wallets, params),
            count: wallets.length,
        };
    }

    private applyOrder(params: Database.IParameters): void {
        const assignOrder = (params, value) => (params.orderBy = value);

        if (!params.orderBy) {
            return assignOrder(params, ["balance", "desc"]);
        }

        const orderByMapped: string[] = params.orderBy.split(":").map(p => p.toLowerCase());

        if (orderByMapped.length !== 2 || ["desc", "asc"].includes(orderByMapped[1]) !== true) {
            return assignOrder(params, ["balance", "desc"]);
        }

        return assignOrder(params, orderByMapped);
    }
}
