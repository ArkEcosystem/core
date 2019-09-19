import { Database } from "@arkecosystem/core-interfaces";
import { delegateCalculator } from "@arkecosystem/core-utils";
import filterRows = require("./filter-rows");
import limitRows = require("./limit-rows");
import { sortEntries } from "./sort-entries";

type CallbackFunctionVariadicVoidReturn = (...args: any[]) => void;

export const searchEntries = <T extends Record<string, any>>(
    params: Database.IParameters,
    query: Record<string, string[]>,
    entries: ReadonlyArray<T>,
    defaultOrder: string[],
): Database.IRowsPaginated<T> => {
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

    entries = sortEntries(params, filterRows(entries, params, query), defaultOrder);

    return {
        rows: limitRows(entries, params),
        count: entries.length,
    };
};

const applyOrder = (
    params: Database.IParameters,
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

const manipulateIteratee = (iteratee): any => {
    switch (iteratee) {
        case "approval":
            return delegateCalculator.calculateApproval;
        case "forgedTotal":
            return delegateCalculator.calculateForgedTotal;
        case "votes":
            return "voteBalance";
        default:
            return iteratee;
    }
};
