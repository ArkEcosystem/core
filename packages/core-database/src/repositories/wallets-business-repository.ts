import { Database, State } from "@arkecosystem/core-interfaces";
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
                // @ts-ignore
                params.address = params.addresses;
                query.exact.shift();
                query.in = ["address"];
            }

            delete params.addresses;
        }

        this.applyOrder(params);

        const wallets: State.IWallet[] = sortEntries(
            params,
            filterRows(this.databaseServiceProvider().walletManager.allByAddress(), params, query),
            ["balance", "desc"],
        );

        return {
            rows: limitRows(wallets, params),
            count: wallets.length,
        };
    }

    public findAllByVote(publicKey: string, params: Database.IParameters = {}): Database.IWalletsPaginated {
        return this.search({ ...params, ...{ vote: publicKey } });
    }

    public findById(id: string): State.IWallet {
        const walletManager: State.IWalletManager = this.databaseServiceProvider().walletManager;

        return (
            walletManager.findByIndex(State.WalletIndexes.Usernames, id) ||
            walletManager.findByIndex(State.WalletIndexes.Addresses, id) ||
            walletManager.findByIndex(State.WalletIndexes.PublicKeys, id)
        );
    }

    public count(): number {
        return this.search().count;
    }

    public top(params: Database.IParameters = {}): Database.IWalletsPaginated {
        return this.search({ ...params, ...{ orderBy: "balance:desc" } });
    }

    // TODO: check if order still works
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
