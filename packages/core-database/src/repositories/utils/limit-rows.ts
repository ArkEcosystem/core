import { Contracts } from "@arkecosystem/core-kernel";

/**
 * Return some rows by an offset and a limit.
 */
export = <T>(rows: ReadonlyArray<T>, params: Contracts.Database.Parameters) => {
    if (params.offset || params.limit) {
        const offset = params.offset || 0;
        const limit = params.limit ? offset + params.limit : rows.length;

        return rows.slice(offset, limit);
    }

    return rows;
};
