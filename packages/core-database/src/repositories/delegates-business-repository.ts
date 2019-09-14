import { Database, State } from "@arkecosystem/core-interfaces";
import { delegateCalculator, hasSomeProperty } from "@arkecosystem/core-utils";
import filterRows from "./utils/filter-rows";
import limitRows from "./utils/limit-rows";
import { sortEntries } from "./utils/sort-entries";

type CallbackFunctionVariadicVoidReturn = (...args: any[]) => void;

export class DelegatesBusinessRepository implements Database.IDelegatesBusinessRepository {
    public constructor(private readonly databaseServiceProvider: () => Database.IDatabaseService) {}

    public search(params: Database.IParameters = {}): Database.IWalletsPaginated {
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

        this.applyOrder(params);

        // Execute...
        let delegates: ReadonlyArray<State.IWallet> = this.databaseServiceProvider().walletManager.allByUsername();

        const manipulators = {
            approval: delegateCalculator.calculateApproval,
            forgedTotal: delegateCalculator.calculateForgedTotal,
        };

        // TODO: fix attributes lookup
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

        delegates = sortEntries(params, filterRows(delegates, params, query), ["rank", "asc"]);

        return {
            rows: limitRows(delegates, params),
            count: delegates.length,
        };
    }

    public findById(id): State.IWallet {
        const walletManager: State.IWalletManager = this.databaseServiceProvider().walletManager;
        const wallet: State.IWallet =
            walletManager.findByIndex(State.WalletIndexes.Usernames, id) ||
            walletManager.findByIndex(State.WalletIndexes.Addresses, id) ||
            walletManager.findByIndex(State.WalletIndexes.PublicKeys, id);

        if (wallet && wallet.isDelegate()) {
            return wallet;
        }

        return undefined;
    }

    private applyOrder(params): [CallbackFunctionVariadicVoidReturn | string, string] {
        const assignOrder = (params, value) => (params.orderBy = value);

        if (!params.orderBy) {
            return assignOrder(params, ["rank", "asc"]);
        }

        const orderByMapped: string[] = params.orderBy.split(":").map(p => p.toLowerCase());

        if (orderByMapped.length !== 2 || ["desc", "asc"].includes(orderByMapped[1]) !== true) {
            return assignOrder(params, ["rank", "asc"]);
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
                return "rate"; // TODO: is this still necessary?
            case "votes":
                return "voteBalance";
            default:
                return iteratee;
        }
    }
}
