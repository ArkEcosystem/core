import { delegateCalculator } from "@arkecosystem/core-utils";

/**
 * Filter an Array of Objects based on the given parameters.
 * @param  {Array} rows
 * @param  {Object} params
 * @param  {Object} filters
 * @return {Array}
 */
export = <T>(rows: T[], params, filters) =>
    rows.filter(item => {
        if (filters.hasOwnProperty("exact")) {
            for (const elem of filters.exact) {
                if (params[elem] && item[elem] !== params[elem]) {
                    return false;
                }
            }
        }

        if (filters.hasOwnProperty("like")) {
            for (const elem of filters.like) {
                if (params[elem] && !item[elem].includes(params[elem])) {
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
                    item[elem] !== params[elem]
                ) {
                    return false;
                }

                if (params[elem].hasOwnProperty("from") || params[elem].hasOwnProperty("to")) {
                    let isMoreThan = true;
                    let isLessThan = true;
                    let property = item[elem];

                    if (elem === "approval") {
                        property = delegateCalculator.calculateApproval(item);
                    } else if (elem === "productivity") {
                        property = delegateCalculator.calculateProductivity(item);
                    } else if (elem === "forgedTotal") {
                        property = delegateCalculator.calculateForgedTotal(item);
                    }

                    if (params[elem].hasOwnProperty("from")) {
                        isMoreThan = property >= params[elem].from;
                    }

                    if (params[elem].hasOwnProperty("to")) {
                        isLessThan = property <= params[elem].to;
                    }

                    return isMoreThan && isLessThan;
                }
            }
        }

        if (filters.hasOwnProperty("in")) {
            for (const elem of filters.in) {
                if (params[elem] && Array.isArray(params[elem])) {
                    return params[elem].indexOf(item[elem]) > -1;
                }
            }
        }

        // NOTE: it was used to filter by `votes`, but that field was rejected and
        // replaced by `vote`. This filter is kept here just in case
        if (filters.hasOwnProperty("any")) {
            for (const elem of filters.any) {
                if (params[elem] && item[elem]) {
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
