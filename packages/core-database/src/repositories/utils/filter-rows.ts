import { State } from '@arkecosystem/core-interfaces';

/**
 * Filter an Array of Objects based on the given parameters.
 * @param  {Array} rows
 * @param  {Object} params
 * @param  {Object} filters
 * @return {Array}
 */
export = (rows: State.IWallet[], params, filters): State.IWallet[] => {
    const get = (item: any, prop: string): any => {
        for (const [key, value] of Object.entries(item)) {
            if (key === prop) {
                return value;
            }

            if (value && value.constructor.name === "Object") {
                const result = get(value, prop);
                if (result) {
                    return result;
                }
            }
        }

        return undefined;
    };

    return rows.filter(item => {
        if (filters.hasOwnProperty("exact")) {
            for (const elem of filters.exact) {
                if (params[elem] && get(item, elem) !== params[elem]) {
                    return false;
                }
            }
        }

        if (filters.hasOwnProperty("like")) {
            for (const elem of filters.like) {
                if (params[elem] && !get(item, elem).includes(params[elem])) {
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
                    get(item, elem) !== params[elem]
                ) {
                    return false;
                }

                if (params[elem].hasOwnProperty("from") || params[elem].hasOwnProperty("to")) {
                    let isMoreThan = true;
                    let isLessThan = true;

                    if (params[elem].hasOwnProperty("from")) {
                        isMoreThan = get(item, elem) >= params[elem].from;
                    }

                    if (params[elem].hasOwnProperty("to")) {
                        isLessThan = get(item, elem) <= params[elem].to;
                    }

                    return isMoreThan && isLessThan;
                }
            }
        }

        if (filters.hasOwnProperty("in")) {
            for (const elem of filters.in) {
                if (params[elem] && Array.isArray(params[elem])) {
                    return params[elem].indexOf(get(item, elem)) > -1;
                }
            }
        }

        // NOTE: it was used to filter by `votes`, but that field was rejected and
        // replaced by `vote`. This filter is kept here just in case
        if (filters.hasOwnProperty("any")) {
            for (const elem of filters.any) {
                if (params[elem] && get(item, elem)) {
                    if (Array.isArray(params[elem])) {
                        if (item[elem].every(a => params[elem].indexOf(a) === -1)) {
                            return false;
                        }
                    } else {
                        throw new Error('Fitering by "any" requires an Array');
                    }
                }
            }
        }

        return true;
    });
};
