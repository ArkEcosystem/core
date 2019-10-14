import { Contracts, Utils } from "@arkecosystem/core-kernel";

import filterRows from "./filter-rows";
import limitRows from "./limit-rows";
import { sortEntries } from "./sort-entries";

type CallbackFunctionVariadicVoidReturn = (...args: any[]) => void;

const manipulateIteratee = (iteratee): any => {
    switch (iteratee) {
        case "approval":
            return Utils.delegateCalculator.calculateApproval;
        case "forgedTotal":
            return Utils.delegateCalculator.calculateForgedTotal;
        case "votes":
            return "voteBalance";
        case "vendorfield":
            return "vendorField";
        case "expirationvalue":
            return "expirationValue";
        case "expirationtype":
            return "expirationType";
        default:
            return iteratee;
    }
};
const applyOrder = (
    params: Contracts.Database.Parameters,
    defaultOrder: string[],
): [CallbackFunctionVariadicVoidReturn | string, string] => {
    const assignOrder = (params, value) => (params.orderBy = value);

    if (!params.orderBy) {
        return assignOrder(params, defaultOrder);
    }

    const orderByMapped: string[] = params.orderBy.split(":").map(p => p.toLowerCase());

    if (orderByMapped.length !== 2 || ["desc", "asc"].includes(orderByMapped[1]) !== true) {
        return assignOrder(params, defaultOrder);
    }

    return assignOrder(params, [manipulateIteratee(orderByMapped[0]), orderByMapped[1]]);
};

export const searchEntries = <T extends Record<string, any>>(
    params: Contracts.Database.Parameters,
    query: Record<string, string[]>,
    entries: ReadonlyArray<T>,
    defaultOrder: string[],
): Contracts.Database.RowsPaginated<T> => {
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

    applyOrder(params, defaultOrder);

    // @ts-ignore
    entries = sortEntries(params, filterRows(entries, params, query), defaultOrder);

    return {
        rows: limitRows(entries, params),
        count: entries.length,
    };
};
