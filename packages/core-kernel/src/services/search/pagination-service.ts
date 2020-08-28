import { Utils } from "@arkecosystem/crypto";

import { Pagination, ResultsPage, Sorting } from "../../contracts/search";
import { injectable } from "../../ioc";
import { get } from "../../utils";

@injectable()
export class PaginationService {
    public getEmptyPage(): ResultsPage<any> {
        return { results: [], totalCount: 0, meta: { totalCountIsEstimate: false } };
    }

    public getPage<T>(pagination: Pagination, sorting: Sorting, items: Iterable<T>): ResultsPage<T> {
        // todo: Array.from(items) can be avoided.
        // todo: There is no reason to sort items that will not be included into result.
        // todo: Only pagination.offset + pagination.limit items have to be kept in memory.

        const total = Array.from(items).sort((a, b) => this.compare(a, b, sorting));

        return {
            results: total.slice(pagination.offset, pagination.offset + pagination.limit),
            totalCount: total.length,
            meta: { totalCountIsEstimate: false },
        };
    }

    public compare<T>(a: T, b: T, sorting: Sorting): number {
        for (const { property, direction } of sorting) {
            let valueA = get(a, property);
            let valueB = get(b, property);

            // undefined and null are always at the end regardless of direction
            if (typeof valueA === "undefined" && typeof valueB !== "undefined") return 1;
            if (typeof valueB === "undefined" && typeof valueA !== "undefined") return -1;
            if (valueA === null && valueB !== null) return 1;
            if (valueB === null && valueA !== null) return -1;

            if (direction === "desc") {
                [valueA, valueB] = [valueB, valueA];
            }

            if (
                (typeof valueA === "boolean" && typeof valueB === "boolean") ||
                (typeof valueA === "string" && typeof valueB === "string") ||
                (typeof valueA === "number" && typeof valueB === "number") ||
                (typeof valueA === "bigint" && typeof valueB === "bigint")
            ) {
                if (valueA < valueB) return -1;
                if (valueA > valueB) return 1;
                continue;
            }

            if (valueA instanceof Utils.BigNumber && valueB instanceof Utils.BigNumber) {
                if (valueA.isLessThan(valueB)) return -1;
                if (valueA.isGreaterThan(valueB)) return 1;
                continue;
            }

            if (typeof valueA !== typeof valueB) {
                throw new Error(`Mismatched types '${typeof valueA}' and '${typeof valueB}' at '${property}'`);
            } else {
                throw new Error(`Unexpected type at '${property}'`);
            }
        }

        return 0;
    }
}
