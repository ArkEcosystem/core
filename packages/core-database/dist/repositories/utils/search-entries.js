"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_utils_1 = require("@arkecosystem/core-utils");
const filterRows = require("./filter-rows");
const limitRows = require("./limit-rows");
const sort_entries_1 = require("./sort-entries");
exports.searchEntries = (params, query, entries, defaultOrder) => {
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
    entries = sort_entries_1.sortEntries(params, filterRows(entries, params, query), defaultOrder);
    return {
        rows: limitRows(entries, params),
        count: entries.length,
    };
};
const applyOrder = (params, defaultOrder) => {
    const assignOrder = (params, value) => (params.orderBy = value);
    if (!params.orderBy) {
        return assignOrder(params, defaultOrder);
    }
    const orderByMapped = params.orderBy.split(":");
    if (orderByMapped.length !== 2 || ["desc", "asc"].includes(orderByMapped[1]) !== true) {
        return assignOrder(params, defaultOrder);
    }
    return assignOrder(params, [manipulateIteratee(orderByMapped[0]), orderByMapped[1]]);
};
const manipulateIteratee = (iteratee) => {
    switch (iteratee) {
        case "approval":
            return core_utils_1.delegateCalculator.calculateApproval;
        case "forgedTotal":
            return core_utils_1.delegateCalculator.calculateForgedTotal;
        case "votes":
        case "votebalance":
            return "voteBalance";
        default:
            return iteratee;
    }
};
//# sourceMappingURL=search-entries.js.map