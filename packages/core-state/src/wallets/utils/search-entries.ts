import { Contracts, Utils } from "@arkecosystem/core-kernel";

import filterWallets from "./filter-rows";
import limitRows from "./limit-rows";
import { OrderBy, sortEntries as sortWallets } from "./sort-entries";

const manipulateIteratee = (iteratee): any => {
    switch (iteratee) {
        case "approval":
            return Utils.delegateCalculator.calculateApproval;
        case "forgedtotal":
            return Utils.delegateCalculator.calculateForgedTotal;
        case "votes":
            return "voteBalance";
        // TODO: check these are no longer used (presumably this function used to be used with transactions?)
        // case "vendorfield":
        //     return "vendorField";
        // case "expirationvalue":
        //     return "expirationValue";
        // case "expirationtype":
        //     return "expirationType";
        default:
            return iteratee;
    }
};
const calculateOrder = (params: Contracts.Database.QueryParameters, defaultOrder: string[]): OrderBy => {
    let orderBy;
    if (!params.orderBy) {
        orderBy = defaultOrder;
        return orderBy;
    }

    // @ts-ignore
    const orderByMapped: string[] = params.orderBy.split(":").map((p) => p.toLowerCase());

    if (orderByMapped.length !== 2 || ["desc", "asc"].includes(orderByMapped[1]) !== true) {
        orderBy = defaultOrder;
        return orderBy;
    }

    orderBy = [manipulateIteratee(orderByMapped[0]), orderByMapped[1]];
    return orderBy;
};

export const searchEntries = <T extends Record<string, any>>(
    params: Contracts.Database.QueryParameters,
    query: Record<string, string[]>,
    wallets: ReadonlyArray<T>,
    defaultOrder: string[],
): Contracts.Search.ListResult<T> => {
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

    const order = calculateOrder(params, defaultOrder);

    // @ts-ignore
    wallets = sortWallets(order, filterWallets(wallets, params, query));

    return {
        // @ts-ignore
        rows: limitRows(wallets, params),
        count: wallets.length,
        countIsEstimate: false,
    };
};
