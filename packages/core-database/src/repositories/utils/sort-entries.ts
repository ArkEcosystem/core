import { Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";
import dottie from "dottie";

import { getProperty } from "./get-property";

// todo: review the implementation
export const sortEntries = <T>(
    params: Contracts.Database.Parameters,
    entries: Contracts.State.Wallet[],
    defaultValue,
) => {
    const [iteratee, order] = params.orderBy ? params.orderBy : defaultValue;

    if (["balance", "voteBalance"].includes(iteratee)) {
        return Object.values(entries).sort((a: Contracts.State.Wallet, b: Contracts.State.Wallet) => {
            const iterateeA: Utils.BigNumber = getProperty(a, iteratee) || Utils.BigNumber.ZERO;
            const iterateeB: Utils.BigNumber = getProperty(b, iteratee) || Utils.BigNumber.ZERO;

            return order === "asc" ? iterateeA.comparedTo(iterateeB) : iterateeB.comparedTo(iterateeA);
        });
    }

    return AppUtils.orderBy(
        entries,
        (entry: T) => {
            if (typeof iteratee === "function") {
                // @ts-ignore
                return iteratee(entry);
            }

            if (dottie.exists(entry, iteratee)) {
                return dottie.get(entry, iteratee);
            }

            const delegateAttribute: string = `attributes.delegate.${iteratee}`;
            if (dottie.exists(entry, delegateAttribute)) {
                return dottie.get(entry, delegateAttribute);
            }

            return dottie.get(entry, `attributes.${iteratee}`);
        },
        [order],
    );
};
