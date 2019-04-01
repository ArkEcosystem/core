import { Database } from "@arkecosystem/core-interfaces";
import snakeCase from "lodash.snakecase";

export class SearchParameterConverter implements Database.ISearchParameterConverter {
    constructor(private databaseModel: Database.IModel) {}

    public convert(params: Database.IParameters, orderBy?: any, paginate?: any): Database.SearchParameters {
        const searchParameters: Database.SearchParameters = {
            orderBy: [],
            paginate: null,
            parameters: [],
        };

        if (!params || !Object.keys(params).length) {
            return searchParameters;
        }

        // paginate and orderBy can be embedded in the other search params.
        if (!paginate && (params.hasOwnProperty("limit") || params.hasOwnProperty("offset"))) {
            this.parsePaginate(searchParameters, params);
        } else {
            this.parsePaginate(searchParameters, paginate);
        }
        if (!orderBy && params.hasOwnProperty("orderBy")) {
            this.parseOrderBy(searchParameters, params.orderBy);
        } else {
            this.parseOrderBy(searchParameters, orderBy);
        }

        this.parseSearchParameters(searchParameters, params);

        return searchParameters;
    }

    private parsePaginate(searchParameters: Database.SearchParameters, paginate?: any) {
        if (paginate) {
            searchParameters.paginate = {
                limit: Number.isInteger(paginate.limit) ? paginate.limit : 100,
                offset: Number.isInteger(paginate.offset) && +paginate.offset > 0 ? paginate.offset : 0,
            };
        }
    }

    private parseOrderBy(searchParameters: Database.SearchParameters, orderBy?: any) {
        if (orderBy && typeof orderBy === "string") {
            const fieldDirection = orderBy.split(":").map(o => o.toLowerCase());
            if (fieldDirection.length === 2 && (fieldDirection[1] === "asc" || fieldDirection[1] === "desc")) {
                searchParameters.orderBy.push({
                    field: snakeCase(fieldDirection[0]),
                    direction: fieldDirection[1] as "asc" | "desc",
                });
            }
        }
    }

    private parseSearchParameters(searchParameters: Database.SearchParameters, params: any) {
        const searchableFields = this.databaseModel.getSearchableFields();
        const mapByFieldName = searchableFields.reduce((p, c) => {
            const map = {};
            map[c.fieldName] = c;
            return Object.assign(map, p);
        }, {});
        /*
            orderBy, limit and offset are parsed earlier.
            page, pagination are added automatically by hapi-pagination
         */
        Object.keys(params)
            .filter(value => !["orderBy", "limit", "offset", "page", "pagination"].includes(value))
            .forEach(fieldName => {
                const fieldDescriptor = mapByFieldName[fieldName] as Database.SearchableField;

                /* null op means that the business repo doesn't know how to categorize what to do w/ with this field so
                let the repo layer decide how it will handle querying this field
                i.e Transactions repo, when parameters contains 'ownerId', some extra logic is done.
                 */
                if (!fieldDescriptor) {
                    searchParameters.parameters.push({
                        field: fieldName,
                        operator: Database.SearchOperator.OP_CUSTOM,
                        value: params[fieldName],
                    });
                    return;
                }

                if (fieldDescriptor.supportedOperators.includes(Database.SearchOperator.OP_LIKE)) {
                    searchParameters.parameters.push({
                        field: fieldName,
                        operator: Database.SearchOperator.OP_LIKE,
                        value: `%${params[fieldName]}%`,
                    });
                    return;
                }

                // 'between'
                if (
                    fieldDescriptor.supportedOperators.includes(Database.SearchOperator.OP_GTE) ||
                    fieldDescriptor.supportedOperators.includes(Database.SearchOperator.OP_LTE)
                ) {
                    // check if we have 'to' & 'from', if not, default to OP_EQ
                    if (!params[fieldName].hasOwnProperty("from") && !params[fieldName].hasOwnProperty("to")) {
                        searchParameters.parameters.push({
                            field: fieldName,
                            operator: Database.SearchOperator.OP_EQ,
                            value: params[fieldName],
                        });
                        return;
                    } else {
                        if (params[fieldName].hasOwnProperty("from")) {
                            searchParameters.parameters.push({
                                field: fieldName,
                                operator: Database.SearchOperator.OP_GTE,
                                value: params[fieldName].from,
                            });
                        }
                        if (params[fieldName].hasOwnProperty("to")) {
                            searchParameters.parameters.push({
                                field: fieldName,
                                operator: Database.SearchOperator.OP_LTE,
                                value: params[fieldName].to,
                            });
                        }
                        return;
                    }
                }

                // If we support 'IN', then the value must be an array(of values)
                if (
                    fieldDescriptor.supportedOperators.includes(Database.SearchOperator.OP_IN) &&
                    Array.isArray(params[fieldName])
                ) {
                    searchParameters.parameters.push({
                        field: fieldName,
                        operator: Database.SearchOperator.OP_IN,
                        value: params[fieldName],
                    });
                    return;
                }

                // if the field supports EQ, then ignore any others.
                if (fieldDescriptor.supportedOperators.includes(Database.SearchOperator.OP_EQ)) {
                    searchParameters.parameters.push({
                        field: fieldName,
                        operator: Database.SearchOperator.OP_EQ,
                        value: params[fieldName],
                    });
                    return;
                }
            });
    }
}
