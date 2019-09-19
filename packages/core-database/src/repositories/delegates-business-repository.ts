import { Database, State } from "@arkecosystem/core-interfaces";
import { delegateCalculator, hasSomeProperty } from "@arkecosystem/core-utils";
import { searchEntries } from "./utils/search-entries";

export class DelegatesBusinessRepository implements Database.IDelegatesBusinessRepository {
    public constructor(private readonly databaseServiceProvider: () => Database.IDatabaseService) {}

    public search(params: Database.IParameters = {}): Database.IRowsPaginated<State.IWallet> {
        // Prepare...
        const query: Record<string, string[]> = {
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

        // Execute...
        let delegates: ReadonlyArray<State.IWallet>;
        switch (params.type) {
            case "resigned": {
                delegates = this.databaseServiceProvider()
                    .walletManager.getIndex(State.WalletIndexes.Resignations)
                    .all();
                break;
            }
            case "never-forged": {
                delegates = this.databaseServiceProvider()
                    .walletManager.allByUsername()
                    .filter(delegate => {
                        return delegate.getAttribute("delegate.producedBlocks") === 0;
                    });
                break;
            }
            default: {
                delegates = this.databaseServiceProvider().walletManager.allByUsername();
                break;
            }
        }

        const manipulators = {
            approval: delegateCalculator.calculateApproval,
            forgedTotal: delegateCalculator.calculateForgedTotal,
        };

        if (hasSomeProperty(params, Object.keys(manipulators))) {
            delegates = delegates.map(delegate => {
                for (const [prop, method] of Object.entries(manipulators)) {
                    if (params.hasOwnProperty(prop)) {
                        delegate.setAttribute(`delegate.${prop}`, method(delegate));
                    }
                }

                return delegate;
            });
        }

        return searchEntries(params, query, delegates, ["rank", "asc"]);
    }

    public findById(id): State.IWallet {
        const walletManager: State.IWalletManager = this.databaseServiceProvider().walletManager;
        const wallet: State.IWallet = walletManager.findByIndex(
            [State.WalletIndexes.Usernames, State.WalletIndexes.Addresses, State.WalletIndexes.PublicKeys],
            id,
        );

        if (wallet && wallet.isDelegate()) {
            return wallet;
        }

        return undefined;
    }
}
