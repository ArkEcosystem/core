import { Utils } from "@arkecosystem/crypto";

import { Ordering, Pagination, ResultsPage } from "../../contracts/search";
import { injectable } from "../../ioc";
import { get } from "../../utils";

@injectable()
export class PaginationService {
    public getEmptyPage(): ResultsPage<any> {
        return { results: [], totalCount: 0, meta: { totalCountIsEstimate: false } };
    }

    public getPage<T>(pagination: Pagination, ordering: Ordering, items: Iterable<T>): ResultsPage<T> {
        const total = Array.from(items).sort((a, b) => this.compare(a, b, ordering));

        return {
            results: total.slice(pagination.offset, pagination.offset + pagination.limit),
            totalCount: total.length,
            meta: { totalCountIsEstimate: false },
        };
    }

    public compare<T>(a: T, b: T, ordering: Ordering): number {
        for (const { property, direction } of ordering) {
            let propertyA = get(a, property);
            let propertyB = get(b, property);

            // undefined are always at the end regardless of direction
            if (typeof propertyA === "undefined" && typeof propertyB !== "undefined") return 1;
            if (typeof propertyB === "undefined" && typeof propertyA !== "undefined") return -1;

            // nulls are also at the end right before undefined
            if (propertyA === null && propertyB !== null) return 1;
            if (propertyB === null && propertyA !== null) return -1;

            if (direction === "desc") {
                [propertyA, propertyB] = [propertyB, propertyA];
            }

            if (
                (typeof propertyA === "boolean" && typeof propertyB === "boolean") ||
                (typeof propertyA === "string" && typeof propertyB === "string") ||
                (typeof propertyA === "number" && typeof propertyB === "number") ||
                (typeof propertyA === "bigint" && typeof propertyB === "bigint")
            ) {
                if (propertyA < propertyB) return -1;
                if (propertyA > propertyB) return 1;
                continue;
            }

            if (propertyA instanceof Utils.BigNumber && propertyB instanceof Utils.BigNumber) {
                if (propertyA.isLessThan(propertyB)) return -1;
                if (propertyA.isGreaterThan(propertyB)) return 1;
                continue;
            }

            if (typeof propertyA !== typeof propertyB) {
                throw new Error("Incompatible types");
            } else {
                throw new Error("Unexpected type");
            }
        }

        return 0;
    }
}
