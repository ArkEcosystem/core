import { Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";

import { getProperty } from "./get-property";

export type OrderBy = (any | string)[];

// todo: review the implementation
export const sortEntries = (params: OrderBy, entries: unknown[]): unknown[] => {
    const [iteratee, order] = params;

    if (["balance", "voteBalance"].includes(iteratee)) {
        return Object.values(entries as Contracts.State.Wallet[]).sort(
            (a: Contracts.State.Wallet, b: Contracts.State.Wallet) => {
                const iterateeA: Utils.BigNumber = getProperty(a, iteratee) || Utils.BigNumber.ZERO;
                const iterateeB: Utils.BigNumber = getProperty(b, iteratee) || Utils.BigNumber.ZERO;

                return order === "asc" ? iterateeA.comparedTo(iterateeB) : iterateeB.comparedTo(iterateeA);
            },
        );
    }

    return AppUtils.orderBy(
        entries,
        // todo: revisit the implementation of this method when wallet search changes are implemented
        // most likely even remove it once the wallet changes have been fully implemented
        (entry: unknown) => {
            if (typeof iteratee === "function") {
                // @ts-ignore
                return iteratee(entry);
            }

            return getProperty(entry, iteratee);
        },
        [order],
    );
};
