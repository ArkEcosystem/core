import { Utils } from "@arkecosystem/crypto";

import { Pagination, ResultsPage, Sorting } from "../../contracts/search";
import { injectable } from "../../ioc";
import { get } from "../../utils";

import createTree from "functional-red-black-tree";

@injectable()
export class PaginationService {
    public getEmptyPage(): ResultsPage<any> {
        return { results: [], totalCount: 0, meta: { totalCountIsEstimate: false } };
    }

    public getPage<T>(pagination: Pagination, sorting: Sorting, items: Iterable<T>): ResultsPage<T> {
        const all = Array.from(items);

        const results =
            sorting.length === 0
                ? all.slice(pagination.offset, pagination.offset + pagination.limit)
                : this.getTop(sorting, pagination.offset + pagination.limit, all).slice(pagination.offset);

        return {
            results,
            totalCount: all.length,
            meta: { totalCountIsEstimate: false },
        };
    }

    public getTop<T>(sorting: Sorting, count: number, items: Iterable<T>): T[] {
        if (count < 0) {
            throw new RangeError(`Count should be greater or equal than zero.`);
        }

        if (count === 0) {
            return [];
        }

        let tree = createTree<T, undefined>((a, b) => {
            return this.compare(a, b, sorting);
        });

        for (const item of items) {
            if (tree.length < count || this.compare(item, tree.end.key, sorting) === -1) {
                tree = tree.insert(item, undefined);
            }

            if (tree.length > count) {
                tree = tree.remove(tree.end.key!);
            }
        }

        return tree.keys;
    }

    public compare<T>(a: T, b: T, sorting: Sorting): number {
        for (const { property, direction } of sorting) {
            let valueA = get(a, property);
            let valueB = get(b, property);

            // undefined and null are always at the end regardless of direction
            if (typeof valueA === "undefined" && typeof valueB === "undefined") return 0;
            if (typeof valueA === "undefined" && typeof valueB !== "undefined") return 1;
            if (typeof valueA !== "undefined" && typeof valueB === "undefined") return -1;
            if (valueA === null && valueB === null) return 0;
            if (valueA === null && valueB !== null) return 1;
            if (valueA !== null && valueB === null) return -1;

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
