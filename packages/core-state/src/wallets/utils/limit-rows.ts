import { Contracts } from "@arkecosystem/core-kernel";

/**
 * Return some rows by an offset and a limit.
 */
// todo: review the implementation
export default <T>(rows: ReadonlyArray<T>, params: Contracts.Database.QueryParameters) => {
    if (params.offset || params.limit) {
        const offset = params.offset || 0;
        // @ts-ignore
        const limit = params.limit ? offset + params.limit : rows.length;

        // @ts-ignore
        return rows.slice(offset, limit);
    }

    return rows;
};
