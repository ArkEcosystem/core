import { Contracts, Utils } from "@arkecosystem/core-kernel";

import filterWallets from "./filter-rows";
import limitRows from "./limit-rows";
import { sortEntries as sortWallets } from "./sort-entries";

type CallbackFunctionVariadicVoidReturn = (...args: any[]) => void;

const manipulateIteratee = (iteratee): any => {
    switch (iteratee) {
        case "approval":
            return Utils.delegateCalculator.calculateApproval;
        case "forgedtotal":
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
const applyOrderToParams = (
    params: Contracts.Database.QueryParameters,
    defaultOrder: string[],
): [CallbackFunctionVariadicVoidReturn | string, string] => {
    const assignOrder = (params, value) => (params.orderBy = value);

    if (!params.orderBy) {
        return assignOrder(params, defaultOrder);
    }

    // @ts-ignore
    const orderByMapped: string[] = params.orderBy.split(":").map(p => p.toLowerCase());

    if (orderByMapped.length !== 2 || ["desc", "asc"].includes(orderByMapped[1]) !== true) {
        return assignOrder(params, defaultOrder);
    }

    return assignOrder(params, [manipulateIteratee(orderByMapped[0]), orderByMapped[1]]);
};

export const searchEntries = <T extends Record<string, any>>(
    params: Contracts.Database.QueryParameters,
    query: Record<string, string[]>,
    wallets: ReadonlyArray<T>,
    defaultOrder: string[],
): Contracts.State.RowsPaginated<T> => {
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

    applyOrderToParams(params, defaultOrder);

    // @ts-ignore
    wallets = sortWallets(params, filterWallets(wallets, params, query), defaultOrder);

    return {
        rows: limitRows(wallets, params),
        count: wallets.length,
    };
};
