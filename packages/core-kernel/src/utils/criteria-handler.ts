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
} from "../contracts/shared/criteria";
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
} from "../contracts/shared/expressions";

export class CriteriaHandler<TEntity> {
    public async handleAndCriteria<TCriteria>(
        criteria: TCriteria,
        cb: <K extends keyof TCriteria>(key: K) => Promise<Expression>,
    ): Promise<Expression> {
        const promises = Object.keys(criteria)
            .filter((key) => typeof criteria[key] !== "undefined")
            .map((key) => cb(key as keyof TCriteria));
        const expressions = await Promise.all(promises);
        return AndExpression.make(expressions);
    }

    public async handleOrCriteria<TCriteria>(
        criteria: OrCriteria<TCriteria>,
        cb: (criteria: TCriteria) => Promise<Expression>,
    ): Promise<Expression> {
        if (Array.isArray(criteria)) {
            const promises = criteria.map((c) => cb(c));
            const expressions = await Promise.all(promises);
            return OrExpression.make(expressions);
        } else {
            return cb(criteria);
        }
    }

    public async handleEqualCriteria<TProperty extends keyof TEntity>(
        property: TProperty,
        criteria: EqualCriteria<NonNullable<TEntity[TProperty]>>,
    ): Promise<Expression> {
        return new EqualExpression<TEntity>(property, criteria);
    }

    public async handleNumericCriteria<TProperty extends keyof TEntity>(
        property: TProperty,
        criteria: NumericCriteria<NonNullable<TEntity[TProperty]>>,
    ): Promise<Expression> {
        if (typeof criteria === "object") {
            if ("from" in criteria && "to" in criteria) {
                return new BetweenExpression<TEntity>(property, criteria.from, criteria.to);
            }
            if ("from" in criteria) {
                return new GreaterThanEqualExpression<TEntity>(property, criteria.from);
            }
            if ("to" in criteria) {
                return new LessThanEqualExpression<TEntity>(property, criteria.to);
            }
        }

        return new EqualExpression<TEntity>(property, criteria);
    }

    public async handleLikeCriteria<TProperty extends keyof TEntity>(
        property: TProperty,
        criteria: LikeCriteria<NonNullable<TEntity[TProperty]>>,
    ): Promise<Expression> {
        return new LikeExpression<TEntity>(property, criteria);
    }

    public async handleContainsCriteria<TProperty extends keyof TEntity>(
        property: TProperty,
        criteria: ContainsCriteria<NonNullable<TEntity[TProperty]>>,
    ): Promise<Expression> {
        return new ContainsExpression<TEntity>(property, criteria);
    }

    public async handleOrEqualCriteria<TProperty extends keyof TEntity>(
        property: TProperty,
        criteria: OrEqualCriteria<NonNullable<TEntity[TProperty]>>,
    ): Promise<Expression> {
        return this.handleOrCriteria(criteria, (c) => this.handleEqualCriteria(property, c));
    }

    public async handleOrNumericCriteria<TProperty extends keyof TEntity>(
        property: TProperty,
        criteria: OrNumericCriteria<NonNullable<TEntity[TProperty]>>,
    ): Promise<Expression> {
        return this.handleOrCriteria(criteria, (c) => this.handleNumericCriteria(property, c));
    }

    public async handleOrLikeCriteria<TProperty extends keyof TEntity>(
        property: TProperty,
        criteria: OrLikeCriteria<NonNullable<TEntity[TProperty]>>,
    ): Promise<Expression> {
        return this.handleOrCriteria(criteria, (c) => this.handleLikeCriteria(property, c));
    }

    public async handleOrContainsCriteria<TProperty extends keyof TEntity>(
        property: TProperty,
        criteria: OrContainsCriteria<NonNullable<TEntity[TProperty]>>,
    ): Promise<Expression> {
        return this.handleOrCriteria(criteria, (c) => this.handleContainsCriteria(property, c));
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
