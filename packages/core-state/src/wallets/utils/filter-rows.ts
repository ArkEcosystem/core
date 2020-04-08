import { Contracts } from "@arkecosystem/core-kernel";

import { getProperty } from "./get-property";

/**
 * Filter an Array of Objects based on the given parameters.
 * @param  {Array} rows
 * @param  {Object} params
 * @param  {Object} filters
 * @return {Array}
 */
export default <T = any>(
    wallets: ReadonlyArray<T>,
    params: Contracts.Database.QueryParameters,
    filters: Record<string, string[]>,
): T[] => {
    return wallets.filter((wallet) => {
        if (filters.hasOwnProperty("exact")) {
            for (const elem of filters.exact) {
                if (params[elem] !== undefined && getProperty(wallet, elem) !== params[elem]) {
                    return false;
                }
            }
        }

        if (filters.hasOwnProperty("like")) {
            for (const elem of filters.like) {
                if (params[elem] && !getProperty(wallet, elem).includes(params[elem])) {
                    return false;
                }
            }
        }

        if (filters.hasOwnProperty("between")) {
            for (const elem of filters.between) {
                if (!params[elem]) {
                    continue;
                }

                if (
                    !params[elem].hasOwnProperty("from") &&
                    !params[elem].hasOwnProperty("to") &&
                    getProperty(wallet, elem) !== params[elem]
                ) {
                    return false;
                }

                if (params[elem].hasOwnProperty("from") || params[elem].hasOwnProperty("to")) {
                    let isMoreThan = true;
                    let isLessThan = true;

                    if (params[elem].hasOwnProperty("from")) {
                        // @ts-ignore
                        isMoreThan = getProperty(wallet, elem) >= params[elem].from;
                    }

                    if (params[elem].hasOwnProperty("to")) {
                        // @ts-ignore
                        isLessThan = getProperty(wallet, elem) <= params[elem].to;
                    }

                    return isMoreThan && isLessThan;
                }
            }
        }

        if (filters.hasOwnProperty("in")) {
            for (const elem of filters.in) {
                if (params[elem] && Array.isArray(params[elem])) {
                    // @ts-ignore
                    return params[elem].indexOf(getProperty(wallet, elem)) > -1;
                }
                return false;
            }
        }

        if (filters.hasOwnProperty("every")) {
            for (const elem of filters.every) {
                if (params[elem] && getProperty(wallet, elem)) {
                    if (Array.isArray(wallet[elem])) {
                        if (Array.isArray(params[elem])) {
                            // @ts-ignore
                            return params[elem].every((a) => wallet[elem].includes(a));
                        } else {
                            throw new Error('Filtering by "every" requires an Array');
                        }
                    } else {
                        throw new Error("Property must be an array");
                    }
                }
            }
        }

        // NOTE: it was used to filter by `votes`, but that field was rejected and
        // replaced by `vote`. This filter is kept here just in case
        if (filters.hasOwnProperty("any")) {
            for (const elem of filters.any) {
                if (params[elem] && getProperty(wallet, elem)) {
                    if (Array.isArray(params[elem])) {
                        // @ts-ignore
                        if (wallet[elem].every((a) => params[elem].indexOf(a) === -1)) {
                            return false;
                        }
                    } else {
                        throw new Error('Filtering by "any" requires an Array');
                    }
                }
            }
        }

        return true;
    });
};
