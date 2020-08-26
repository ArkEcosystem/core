import { Utils } from "@arkecosystem/crypto";

import { Ordering, Pagination, ResultsPage } from "../../contracts/search";
import { injectable } from "../../ioc";
import { BigNumber, get } from "../../utils";

@injectable()
export class PaginationService {
    public getEmptyPage(): ResultsPage<any> {
        return { results: [], totalCount: 0, meta: { totalCountIsEstimate: false } };
    }

    public getPage<T>(pagination: Pagination, ordering: Ordering, items: Iterable<T>): ResultsPage<T> {
        const total = Array.from(items).sort((a, b) => {
            let result = 0;

            for (const { direction, property } of ordering) {
                if (direction === "asc") {
                    result = this.compareValues(get(a, property), get(b, property));
                } else {
                    result = this.compareValues(get(b, property), get(a, property));
                }

                if (result !== 0) {
                    break;
                }
            }

            return result;
        });

        return {
            results: total.slice(pagination.offset, pagination.offset + pagination.limit),
            totalCount: total.length,
            meta: { totalCountIsEstimate: false },
        };
    }

    public compareValues(a: unknown, b: unknown): number {
        if (typeof a === "undefined" || typeof b === "undefined" || a === null || b === null) {
            // todo: undefined or null should be sorted to the bottom regardless of direction (asc or desc)
            return 0;
        }

        if (typeof a === "boolean" && typeof b === "boolean") {
            if (a === b) return 0;
            if (a === false) return -1;
            if (a === true) return 1;
        }

        if (typeof a === "number" && typeof b === "number") {
            return a - b;
        }

        if (
            (typeof a === "number" || typeof a === "bigint" || a instanceof Utils.BigNumber) &&
            (typeof b === "number" || typeof b === "bigint" || b instanceof Utils.BigNumber)
        ) {
            return BigNumber.make(a).comparedTo(BigNumber.make(b));
        }

        if (typeof a === "string" && typeof b === "string") {
            return a.localeCompare(b);
        }

        throw new Error("Incompatible types");
    }
}
