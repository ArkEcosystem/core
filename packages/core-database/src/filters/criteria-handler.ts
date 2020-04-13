import { Contracts } from "@arkecosystem/core-kernel";

export class CriteriaHandler<TEntity> {
    public async handleAndCriteria<TCriteria>(
        criteria: TCriteria,
        cb: <K extends keyof TCriteria>(key: K) => Promise<Contracts.Database.Expression>,
    ): Promise<Contracts.Database.Expression> {
        const promises = Object.keys(criteria)
            .filter((key) => typeof criteria[key] !== "undefined")
            .map((key) => cb(key as keyof TCriteria));
        const expressions = await Promise.all(promises);
        return Contracts.Database.AndExpression.make(expressions);
    }

    public async handleOrCriteria<TCriteria>(
        criteria: Contracts.Database.OrCriteria<TCriteria>,
        cb: (criteria: TCriteria) => Promise<Contracts.Database.Expression>,
    ): Promise<Contracts.Database.Expression> {
        if (Array.isArray(criteria)) {
            const promises = criteria.map((c) => cb(c));
            const expressions = await Promise.all(promises);
            return Contracts.Database.OrExpression.make(expressions);
        } else {
            return cb(criteria);
        }
    }

    public async handleEqualCriteria<TProperty extends keyof TEntity>(
        property: TProperty,
        criteria: Contracts.Database.EqualCriteria<NonNullable<TEntity[TProperty]>>,
    ): Promise<Contracts.Database.Expression> {
        return new Contracts.Database.EqualExpression<TEntity>(property, criteria);
    }

    public async handleNumericCriteria<TProperty extends keyof TEntity>(
        property: TProperty,
        criteria: Contracts.Database.NumericCriteria<NonNullable<TEntity[TProperty]>>,
    ): Promise<Contracts.Database.Expression> {
        if (typeof criteria === "object") {
            if ("from" in criteria && "to" in criteria) {
                return new Contracts.Database.BetweenExpression<TEntity>(property, criteria.from, criteria.to);
            }
            if ("from" in criteria) {
                return new Contracts.Database.GreaterThanEqualExpression<TEntity>(property, criteria.from);
            }
            if ("to" in criteria) {
                return new Contracts.Database.LessThanEqualExpression<TEntity>(property, criteria.to);
            }
        }

        return new Contracts.Database.EqualExpression<TEntity>(property, criteria);
    }

    public async handleLikeCriteria<TProperty extends keyof TEntity>(
        property: TProperty,
        criteria: Contracts.Database.LikeCriteria<NonNullable<TEntity[TProperty]>>,
    ): Promise<Contracts.Database.Expression> {
        return new Contracts.Database.LikeExpression<TEntity>(property, criteria);
    }

    public async handleContainsCriteria<TProperty extends keyof TEntity>(
        property: TProperty,
        criteria: Contracts.Database.ContainsCriteria<NonNullable<TEntity[TProperty]>>,
    ): Promise<Contracts.Database.Expression> {
        return new Contracts.Database.ContainsExpression<TEntity>(property, criteria);
    }

    public async handleOrEqualCriteria<TProperty extends keyof TEntity>(
        property: TProperty,
        criteria: Contracts.Database.OrEqualCriteria<NonNullable<TEntity[TProperty]>>,
    ): Promise<Contracts.Database.Expression> {
        return this.handleOrCriteria(criteria, (c) => this.handleEqualCriteria(property, c));
    }

    public async handleOrNumericCriteria<TProperty extends keyof TEntity>(
        property: TProperty,
        criteria: Contracts.Database.OrNumericCriteria<NonNullable<TEntity[TProperty]>>,
    ): Promise<Contracts.Database.Expression> {
        return this.handleOrCriteria(criteria, (c) => this.handleNumericCriteria(property, c));
    }

    public async handleOrLikeCriteria<TProperty extends keyof TEntity>(
        property: TProperty,
        criteria: Contracts.Database.OrLikeCriteria<NonNullable<TEntity[TProperty]>>,
    ): Promise<Contracts.Database.Expression> {
        return this.handleOrCriteria(criteria, (c) => this.handleLikeCriteria(property, c));
    }

    public async handleOrContainsCriteria<TProperty extends keyof TEntity>(
        property: TProperty,
        criteria: Contracts.Database.OrContainsCriteria<NonNullable<TEntity[TProperty]>>,
    ): Promise<Contracts.Database.Expression> {
        return this.handleOrCriteria(criteria, (c) => this.handleContainsCriteria(property, c));
    }

    public someOrCriteria<TCriteria>(
        criteria: Contracts.Database.OrCriteria<TCriteria>,
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
        criteria: Contracts.Database.OrCriteria<TCriteria>,
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

    public hasOrCriteria<TCriteria>(criteria: Contracts.Database.OrCriteria<TCriteria>): boolean {
        return this.someOrCriteria(criteria, () => true);
    }
}
