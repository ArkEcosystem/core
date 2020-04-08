import {
    ContainsCriteria,
    EqualCriteria,
    LikeCriteria,
    NumericCriteria,
    OrContainsCriteria,
    OrCriteria,
    OrEqualCriteria,
    OrLikeCriteria,
    OrNumericCriteria,
} from "./criteria";
import {
    AndExpression,
    BetweenExpression,
    ContainsExpression,
    EqualExpression,
    Expression,
    GreaterThanEqualExpression,
    LessThanEqualExpression,
    LikeExpression,
    OrExpression,
} from "./expressions";

export class CriteriaHandler<TModel> {
    public async handleAndCriteria<TCriteria>(
        criteria: TCriteria,
        cb: <K extends keyof TCriteria>(key: K) => Promise<Expression<TModel>>,
    ): Promise<Expression<TModel>> {
        const promises = Object.keys(criteria)
            .filter(key => typeof criteria[key] !== "undefined")
            .map(key => cb(key as keyof TCriteria));
        const expressions = await Promise.all(promises);
        return AndExpression.make(expressions);
    }

    public async handleOrCriteria<TCriteria>(
        criteria: OrCriteria<TCriteria>,
        cb: (criteria: TCriteria) => Promise<Expression<TModel>>,
    ): Promise<Expression<TModel>> {
        if (Array.isArray(criteria)) {
            const promises = criteria.map(c => cb(c));
            const expressions = await Promise.all(promises);
            return OrExpression.make(expressions);
        } else {
            return cb(criteria);
        }
    }

    public async handleEqualCriteria<TProperty extends keyof TModel>(
        property: TProperty,
        criteria: EqualCriteria<TModel[TProperty]>,
    ): Promise<Expression<TModel>> {
        return new EqualExpression(property, criteria);
    }

    public async handleNumericCriteria<TProperty extends keyof TModel>(
        property: TProperty,
        criteria: NumericCriteria<TModel[TProperty]>,
    ): Promise<Expression<TModel>> {
        if (typeof criteria === "object") {
            if ("from" in criteria && "to" in criteria) {
                return new BetweenExpression(property, criteria.from, criteria.to);
            }
            if ("from" in criteria) {
                return new GreaterThanEqualExpression(property, criteria.from);
            }
            if ("to" in criteria) {
                return new LessThanEqualExpression(property, criteria.to);
            }
        }

        return new EqualExpression(property, criteria);
    }

    public async handleLikeCriteria<TProperty extends keyof TModel>(
        property: TProperty,
        criteria: LikeCriteria<TModel[TProperty]>,
    ): Promise<Expression<TModel>> {
        return new LikeExpression(property, criteria);
    }

    public async handleContainsCriteria<TProperty extends keyof TModel>(
        property: TProperty,
        criteria: ContainsCriteria<TModel[TProperty]>,
    ): Promise<Expression<TModel>> {
        return new ContainsExpression(property, criteria);
    }

    public async handleOrEqualCriteria<TProperty extends keyof TModel>(
        property: TProperty,
        criteria: OrEqualCriteria<TModel[TProperty]>,
    ): Promise<Expression<TModel>> {
        return this.handleOrCriteria(criteria, c => this.handleEqualCriteria(property, c));
    }

    public async handleOrNumericCriteria<TProperty extends keyof TModel>(
        property: TProperty,
        criteria: OrNumericCriteria<TModel[TProperty]>,
    ): Promise<Expression<TModel>> {
        return this.handleOrCriteria(criteria, c => this.handleNumericCriteria(property, c));
    }

    public async handleOrLikeCriteria<TProperty extends keyof TModel>(
        property: TProperty,
        criteria: OrLikeCriteria<TModel[TProperty]>,
    ): Promise<Expression<TModel>> {
        return this.handleOrCriteria(criteria, c => this.handleLikeCriteria(property, c));
    }

    public async handleOrContainsCriteria<TProperty extends keyof TModel>(
        property: TProperty,
        criteria: OrContainsCriteria<TModel[TProperty]>,
    ): Promise<Expression<TModel>> {
        return this.handleOrCriteria(criteria, c => this.handleContainsCriteria(property, c));
    }

    public someOrCriteria<TCriteria>(criteria: OrCriteria<TCriteria>, predicate: (c: TCriteria) => boolean): boolean {
        if (typeof criteria === "undefined") {
            return false;
        }
        if (Array.isArray(criteria)) {
            return criteria.some(predicate);
        }
        return predicate(criteria);
    }

    public everyOrCriteria<TCriteria>(criteria: OrCriteria<TCriteria>, predicate: (c: TCriteria) => boolean): boolean {
        if (typeof criteria === "undefined") {
            return false;
        }
        if (Array.isArray(criteria)) {
            return criteria.every(predicate);
        }
        return predicate(criteria);
    }

    public hasOrCriteria<TCriteria>(criteria: OrCriteria<TCriteria>): boolean {
        return this.someOrCriteria(criteria, () => true);
    }
}
