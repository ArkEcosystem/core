import { Database } from "@arkecosystem/core-interfaces";
import { Utils } from "@arkecosystem/crypto";
import { orderBy } from "@arkecosystem/utils";
import dottie from "dottie";
import { getProperty } from "./get-property";

export const sortEntries = <T extends Record<string, any>>(
    params: Database.IParameters,
    entries: T[],
    defaultOrder: string[],
): T[] => {
    const [iteratee, order] = params.orderBy ? params.orderBy : defaultOrder;

    if (
        [
            "amount",
            "balance",
            "fee",
            "forgedFees",
            "forgedRewards",
            "lockedBalance",
            "nonce",
            "totalAmount",
            "totalFee",
            "voteBalance",
        ].includes(iteratee)
    ) {
        return Object.values(entries).sort((a: T, b: T) => {
            const iterateeA: Utils.BigNumber = getProperty(a, iteratee) || Utils.BigNumber.ZERO;
            const iterateeB: Utils.BigNumber = getProperty(b, iteratee) || Utils.BigNumber.ZERO;

            return order === "asc" ? iterateeA.comparedTo(iterateeB) : iterateeB.comparedTo(iterateeA);
        });
    }

    return orderBy(
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
