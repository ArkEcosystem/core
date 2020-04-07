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
    VoidExpression,
} from "./expressions";

export type EqualCriteria<T> = T;
export type NumericCriteria<T> = T | { from: T } | { to: T } | { from: T; to: T };
export type LikeCriteria<T> = T;
export type ContainsCriteria<T> = T;
export type OrCriteria<TCriteria> = TCriteria | TCriteria[];
export type OrEqualCriteria<T> = OrCriteria<EqualCriteria<T>>;
export type OrNumericCriteria<T> = OrCriteria<NumericCriteria<T>>;
export type OrLikeCriteria<T> = OrCriteria<LikeCriteria<T>>;
export type OrContainsCriteria<T> = OrCriteria<ContainsCriteria<T>>;

export const someOrCriteria = <TCriteria>(
    criteria: OrCriteria<TCriteria>,
    predicate: (criteria: TCriteria) => boolean,
): boolean => {
    return Array.isArray(criteria) ? criteria.some(predicate) : predicate(criteria);
};

export const everyOrCriteria = <TCriteria>(
    criteria: OrCriteria<TCriteria>,
    predicate: (criteria: TCriteria) => boolean,
): boolean => {
    return Array.isArray(criteria) ? criteria.every(predicate) : predicate(criteria);
};

export const hasOrCriteria = <TCriteria>(criteria: OrCriteria<TCriteria>): boolean => {
    return someOrCriteria(criteria, () => true);
};

export interface Filter<TModel, TCriteria> {
    getExpression(criteria: TCriteria): Promise<Expression<TModel>>;
}

export class OrFilter<TModel, TCriteria> implements Filter<TModel, OrCriteria<TCriteria>> {
    private readonly filter: Filter<TModel, TCriteria>;

    public constructor(filter: Filter<TModel, TCriteria>) {
        this.filter = filter;
    }

    public async getExpression(criteria: OrCriteria<TCriteria>): Promise<Expression<TModel>> {
        if (Array.isArray(criteria)) {
            const promises = criteria.map(c => this.filter.getExpression(c));
            const expressions = await Promise.all(promises);
            return OrExpression.make(expressions);
        } else {
            return this.filter.getExpression(criteria);
        }
    }
}

export class EqualFilter<TModel, TProperty extends keyof TModel>
    implements Filter<TModel, EqualCriteria<TModel[TProperty]>> {
    private readonly property: TProperty;

    public constructor(property: TProperty) {
        this.property = property;
    }

    public async getExpression(criteria: EqualCriteria<TModel[TProperty]>): Promise<Expression<TModel>> {
        return new EqualExpression(this.property, criteria);
    }
}

export class OrEqualFilter<TModel, TProperty extends keyof TModel>
    implements Filter<TModel, OrEqualCriteria<TModel[TProperty]>> {
    private readonly filter: Filter<TModel, OrEqualCriteria<TModel[TProperty]>>;

    public constructor(property: TProperty) {
        this.filter = new OrFilter(new EqualFilter(property));
    }

    public async getExpression(criteria: OrEqualCriteria<TModel[TProperty]>): Promise<Expression<TModel>> {
        return this.filter.getExpression(criteria);
    }
}

export class NumericFilter<TModel, TProperty extends keyof TModel>
    implements Filter<TModel, NumericCriteria<TModel[TProperty]>> {
    private readonly property: TProperty;

    public constructor(property: TProperty) {
        this.property = property;
    }

    public async getExpression(criteria: NumericCriteria<TModel[TProperty]>): Promise<Expression<TModel>> {
        if (typeof criteria === "object") {
            if ("from" in criteria && "to" in criteria) {
                return new BetweenExpression(this.property, criteria.from, criteria.to);
            }
            if ("from" in criteria) {
                return new GreaterThanEqualExpression(this.property, criteria.from);
            }
            if ("to" in criteria) {
                return new LessThanEqualExpression(this.property, criteria.to);
            }
        }

        return new EqualExpression(this.property, criteria);
    }
}

export class OrNumericFilter<TModel, TProperty extends keyof TModel>
    implements Filter<TModel, OrNumericCriteria<TModel[TProperty]>> {
    private readonly filter: Filter<TModel, OrNumericCriteria<TModel[TProperty]>>;

    public constructor(property: TProperty) {
        this.filter = new OrFilter(new NumericFilter(property));
    }

    public async getExpression(criteria: OrNumericCriteria<TModel[TProperty]>): Promise<Expression<TModel>> {
        return this.filter.getExpression(criteria);
    }
}

export class LikeFilter<TModel, TProperty extends keyof TModel>
    implements Filter<TModel, LikeCriteria<TModel[TProperty]>> {
    private readonly property: TProperty;

    public constructor(property: TProperty) {
        this.property = property;
    }

    public async getExpression(criteria: LikeCriteria<TModel[TProperty]>): Promise<Expression<TModel>> {
        return new LikeExpression(this.property, criteria);
    }
}

export class OrLikeFilter<TModel, TProperty extends keyof TModel>
    implements Filter<TModel, OrLikeCriteria<TModel[TProperty]>> {
    private readonly filter: Filter<TModel, OrLikeCriteria<TModel[TProperty]>>;

    public constructor(property: TProperty) {
        this.filter = new OrFilter(new LikeFilter(property));
    }

    public async getExpression(criteria: OrLikeCriteria<TModel[TProperty]>): Promise<Expression<TModel>> {
        return this.filter.getExpression(criteria);
    }
}

export class ContainsFilter<TModel, TProperty extends keyof TModel>
    implements Filter<TModel, ContainsCriteria<TModel[TProperty]>> {
    private readonly property: TProperty;

    public constructor(property: TProperty) {
        this.property = property;
    }

    public async getExpression(criteria: ContainsCriteria<TModel[TProperty]>): Promise<Expression<TModel>> {
        return new ContainsExpression(this.property, criteria);
    }
}

export class OrContainsFilter<TModel, TProperty extends keyof TModel>
    implements Filter<TModel, OrContainsCriteria<TModel[TProperty]>> {
    private readonly filter: Filter<TModel, OrContainsCriteria<TModel[TProperty]>>;

    public constructor(property: TProperty) {
        this.filter = new OrFilter(new ContainsFilter(property));
    }

    public async getExpression(criteria: OrContainsCriteria<TModel[TProperty]>): Promise<Expression<TModel>> {
        return this.filter.getExpression(criteria);
    }
}

export class FnFilter<TModel, TCriteria> implements Filter<TModel, TCriteria> {
    private readonly fn: (criteria: TCriteria) => Promise<Expression<TModel>>;

    public constructor(fn: (criteria: TCriteria) => Promise<Expression<TModel>>) {
        this.fn = fn;
    }

    public async getExpression(criteria: TCriteria): Promise<Expression<TModel>> {
        return this.fn(criteria);
    }
}

export class OrFnFilter<TModel, TCriteria> implements Filter<TModel, OrCriteria<TCriteria>> {
    private readonly filter: Filter<TModel, OrCriteria<TCriteria>>;

    public constructor(fn: (criteria: TCriteria) => Promise<Expression<TModel>>) {
        this.filter = new OrFilter(new FnFilter(fn));
    }

    public async getExpression(criteria: OrCriteria<TCriteria>): Promise<Expression<TModel>> {
        return this.filter.getExpression(criteria);
    }
}

export type AndFilters<TModel, TCriteria> = {
    [K in keyof TCriteria]: Filter<TModel, NonNullable<TCriteria[K]>>;
};

export class AndFilter<TModel, TCriteria> implements Filter<TModel, TCriteria> {
    private readonly filters: AndFilters<TModel, TCriteria>;

    public constructor(filters: AndFilters<TModel, TCriteria>) {
        this.filters = filters;
    }

    public async getExpression(criteria: TCriteria): Promise<Expression<TModel>> {
        const promises = Object.keys(this.filters).map(key => {
            if (key in criteria && typeof criteria[key] !== "undefined") {
                return this.filters[key].getExpression(criteria[key]);
            } else {
                return Promise.resolve(new VoidExpression());
            }
        });
        const expressions = await Promise.all(promises);
        return AndExpression.make(expressions);
    }
}
