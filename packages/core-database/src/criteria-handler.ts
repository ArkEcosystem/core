import { Contracts } from "@arkecosystem/core-kernel";

export class CriteriaHandler<TEntity> {
    public async handleAndCriteria<TCriteria>(
        criteria: TCriteria,
        cb: <K extends keyof TCriteria>(key: K) => Promise<Contracts.Shared.WhereExpression>,
    ): Promise<Contracts.Shared.WhereExpression> {
        const promises = Object.keys(criteria)
            .filter((key) => typeof criteria[key] !== "undefined")
            .map((key) => cb(key as keyof TCriteria));
        const expressions = await Promise.all(promises);
        return Contracts.Shared.AndExpression.make(expressions);
    }

    public async handleOrCriteria<TCriteria>(
        criteria: Contracts.Shared.OrCriteria<TCriteria>,
        cb: (criteria: TCriteria) => Promise<Contracts.Shared.WhereExpression>,
    ): Promise<Contracts.Shared.WhereExpression> {
        if (Array.isArray(criteria)) {
            const promises = criteria.map((c) => cb(c));
            const expressions = await Promise.all(promises);
            return Contracts.Shared.OrExpression.make(expressions);
        } else {
            return cb(criteria);
        }
    }

    public async handleEqualCriteria<TProperty extends keyof TEntity>(
        property: TProperty,
        criteria: Contracts.Shared.EqualCriteria<NonNullable<TEntity[TProperty]>>,
    ): Promise<Contracts.Shared.WhereExpression> {
        return new Contracts.Shared.EqualExpression<TEntity>(property, criteria);
    }

    public async handleNumericCriteria<TProperty extends keyof TEntity>(
        property: TProperty,
        criteria: Contracts.Shared.NumericCriteria<NonNullable<TEntity[TProperty]>>,
    ): Promise<Contracts.Shared.WhereExpression> {
        if (typeof criteria === "object") {
            if ("from" in criteria && "to" in criteria) {
                return new Contracts.Shared.BetweenExpression<TEntity>(property, criteria.from, criteria.to);
            }
            if ("from" in criteria) {
                return new Contracts.Shared.GreaterThanEqualExpression<TEntity>(property, criteria.from);
            }
            if ("to" in criteria) {
                return new Contracts.Shared.LessThanEqualExpression<TEntity>(property, criteria.to);
            }
        }

        return new Contracts.Shared.EqualExpression<TEntity>(property, criteria);
    }

    public async handleLikeCriteria<TProperty extends keyof TEntity>(
        property: TProperty,
        criteria: Contracts.Shared.LikeCriteria<NonNullable<TEntity[TProperty]>>,
    ): Promise<Contracts.Shared.WhereExpression> {
        return new Contracts.Shared.LikeExpression<TEntity>(property, criteria);
    }

    public async handleContainsCriteria<TProperty extends keyof TEntity>(
        property: TProperty,
        criteria: Contracts.Shared.ContainsCriteria<NonNullable<TEntity[TProperty]>>,
    ): Promise<Contracts.Shared.WhereExpression> {
        return new Contracts.Shared.ContainsExpression<TEntity>(property, criteria);
    }

    public async handleOrEqualCriteria<TProperty extends keyof TEntity>(
        property: TProperty,
        criteria: Contracts.Shared.OrEqualCriteria<NonNullable<TEntity[TProperty]>>,
    ): Promise<Contracts.Shared.WhereExpression> {
        return this.handleOrCriteria(criteria, (c) => this.handleEqualCriteria(property, c));
    }

    public async handleOrNumericCriteria<TProperty extends keyof TEntity>(
        property: TProperty,
        criteria: Contracts.Shared.OrNumericCriteria<NonNullable<TEntity[TProperty]>>,
    ): Promise<Contracts.Shared.WhereExpression> {
        return this.handleOrCriteria(criteria, (c) => this.handleNumericCriteria(property, c));
    }

    public async handleOrLikeCriteria<TProperty extends keyof TEntity>(
        property: TProperty,
        criteria: Contracts.Shared.OrLikeCriteria<NonNullable<TEntity[TProperty]>>,
    ): Promise<Contracts.Shared.WhereExpression> {
        return this.handleOrCriteria(criteria, (c) => this.handleLikeCriteria(property, c));
    }

    public async handleOrContainsCriteria<TProperty extends keyof TEntity>(
        property: TProperty,
        criteria: Contracts.Shared.OrContainsCriteria<NonNullable<TEntity[TProperty]>>,
    ): Promise<Contracts.Shared.WhereExpression> {
        return this.handleOrCriteria(criteria, (c) => this.handleContainsCriteria(property, c));
    }

    public someOrCriteria<TCriteria>(
        criteria: Contracts.Shared.OrCriteria<TCriteria>,
        predicate: (c: TCriteria) => boolean,
    ): boolean {
        if (typeof criteria === "undefined") {
            return false;
        }
        if (Array.isArray(criteria)) {
            return criteria.some(predicate);
        }
        return predicate(criteria);
    }

    public everyOrCriteria<TCriteria>(
        criteria: Contracts.Shared.OrCriteria<TCriteria>,
        predicate: (c: TCriteria) => boolean,
    ): boolean {
        if (typeof criteria === "undefined") {
            return false;
        }
        if (Array.isArray(criteria)) {
            return criteria.every(predicate);
        }
        return predicate(criteria);
    }

    public hasOrCriteria<TCriteria>(criteria: Contracts.Shared.OrCriteria<TCriteria>): boolean {
        return this.someOrCriteria(criteria, () => true);
    }
}
