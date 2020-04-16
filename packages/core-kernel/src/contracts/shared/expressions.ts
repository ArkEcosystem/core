export interface WhereExpression {}

export class VoidExpression implements WhereExpression {}

export class FalseExpression implements WhereExpression {}

export class TrueExpression implements WhereExpression {}

export class EqualExpression<TEntity> implements WhereExpression {
    public readonly property: keyof TEntity;
    public readonly value: any;

    public constructor(property: keyof TEntity, value: any) {
        this.property = property;
        this.value = value;
    }
}

export class BetweenExpression<TEntity> implements WhereExpression {
    public readonly property: keyof TEntity;
    public readonly from: any;
    public readonly to: any;

    public constructor(property: keyof TEntity, from: any, to: any) {
        this.property = property;
        this.from = from;
        this.to = to;
    }
}

export class GreaterThanEqualExpression<TEntity> implements WhereExpression {
    public readonly property: keyof TEntity;
    public readonly from: any;

    public constructor(property: keyof TEntity, from: any) {
        this.property = property;
        this.from = from;
    }
}

export class LessThanEqualExpression<TEntity> implements WhereExpression {
    public readonly property: keyof TEntity;
    public readonly to: any;

    public constructor(property: keyof TEntity, to: any) {
        this.property = property;
        this.to = to;
    }
}

export class LikeExpression<TEntity> implements WhereExpression {
    public readonly property: keyof TEntity;
    public readonly value: any;

    public constructor(property: keyof TEntity, value: any) {
        this.property = property;
        this.value = value;
    }
}

export class ContainsExpression<TEntity> implements WhereExpression {
    public readonly property: keyof TEntity;
    public readonly value: any;

    public constructor(property: keyof TEntity, value: any) {
        this.property = property;
        this.value = value;
    }
}

export class AndExpression implements WhereExpression {
    public readonly expressions: WhereExpression[];

    private constructor(expressions: WhereExpression[]) {
        this.expressions = expressions;
    }

    public static make(expressions: WhereExpression[]): WhereExpression {
        const flattened: WhereExpression[] = [];

        for (const exp of expressions) {
            if (exp instanceof VoidExpression) {
                continue;
            }
            if (exp instanceof AndExpression) {
                for (const e of exp.expressions) {
                    flattened.push(e);
                }
            } else {
                flattened.push(exp);
            }
        }

        if (flattened.length === 0) {
            return new VoidExpression();
        }
        if (flattened.length === 1) {
            return flattened[0];
        }

        return new AndExpression(flattened);
    }
}

export class OrExpression implements WhereExpression {
    public readonly expressions: WhereExpression[];

    private constructor(expressions: WhereExpression[]) {
        this.expressions = expressions;
    }

    public static make(expressions: WhereExpression[]): WhereExpression {
        const flattened: WhereExpression[] = [];

        for (const exp of expressions) {
            if (exp instanceof VoidExpression) {
                continue;
            }
            if (exp instanceof OrExpression) {
                for (const e of exp.expressions) {
                    flattened.push(e);
                }
            } else {
                flattened.push(exp);
            }
        }

        if (flattened.length === 0) {
            return new VoidExpression();
        }
        if (flattened.length === 1) {
            return flattened[0];
        }

        return new OrExpression(flattened);
    }
}
