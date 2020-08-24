import { Utils } from "@arkecosystem/crypto";

import { Ordering, Page, Pagination } from "../../contracts/search";
import { injectable } from "../../ioc";
import { BigNumber, get } from "../../utils";

@injectable()
export class PaginationService {
    public getEmptyPage(): Page<any> {
        return { results: [], totalCount: 0, meta: { totalCountIsEstimate: false } };
    }

    public getPage<T>(pagination: Pagination, ordering: Ordering, items: Iterable<T>): Page<T> {
        const total = Array.from(items).sort((a, b) => {
            let result = 0;

            for (const { direction, path } of ordering) {
                if (direction === "asc") {
                    result = this.compareValues(get(a, path), get(b, path));
                } else {
                    result = this.compareValues(get(b, path), get(a, path));
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
