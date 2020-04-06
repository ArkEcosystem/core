import { ContainsCriteria, EqualCriteria, LikeCriteria, Numeric, NumericCriteria, OrCriteria } from "./criteria";
import {
    andExpression,
    betweenExpression,
    containsExpression,
    equalExpression,
    Expression,
    greaterThanEqualExpression,
    lessThanEqualExpression,
    likeExpression,
    orExpression,
    voidExpression,
} from "./expressions";

export type Filter<TModel, TCriteria> = (criteria: TCriteria) => Promise<Expression<TModel>>;

export const createOrFilter = <TModel, TCriteria>(
    filter: Filter<TModel, TCriteria>,
): Filter<TModel, OrCriteria<TCriteria>> => {
    return async criteria => {
        if (Array.isArray(criteria)) {
            return orExpression(await Promise.all(criteria.map(filter)));
        } else {
            return filter(criteria);
        }
    };
};

export const createAndFilter = <TModel, TCriteria>(
    filters: { [K in keyof TCriteria]: Filter<TModel, NonNullable<TCriteria[K]>> },
): Filter<TModel, { [K in keyof TCriteria]?: TCriteria[K] }> => {
    return async criteria => {
        const promises = Object.keys(filters).map(key => {
            if (key in criteria) {
                return filters[key](criteria[key]);
            } else {
                return Promise.resolve(voidExpression());
            }
        });

        return andExpression(await Promise.all(promises));
    };
};

export const createValueFilter = <TModel, TProperty extends keyof TModel>(
    model: new () => TModel,
    property: TProperty,
): Filter<TModel, EqualCriteria<any>> => {
    return async criteria => equalExpression(model, property, criteria);
};

export const createNumericFilter = <TModel, TProperty extends keyof TModel>(
    model: new () => TModel,
    property: TProperty,
): Filter<TModel, NumericCriteria<Numeric>> => {
    return async criteria => {
        if (typeof criteria === "object") {
            if ("from" in criteria && "to" in criteria) {
                return betweenExpression(model, property, criteria.from, criteria.to);
            }
            if ("from" in criteria) {
                return greaterThanEqualExpression(model, property, criteria.from);
            }
            if ("to" in criteria) {
                return lessThanEqualExpression(model, property, criteria.to);
            }
        }
        return equalExpression(model, property, criteria);
    };
};

export const createStringFilter = <TModel, TProperty extends keyof TModel>(
    model: new () => TModel,
    property: TProperty,
): Filter<TModel, LikeCriteria<string>> => {
    return async criteria => {
        return likeExpression(model, property, criteria);
    };
};

export const createJsonFilter = <TModel, TProperty extends keyof TModel>(
    model: new () => TModel,
    property: TProperty,
): Filter<TModel, ContainsCriteria<Record<string, any>>> => {
    return async criteria => {
        return containsExpression(model, property, criteria);
    };
};
