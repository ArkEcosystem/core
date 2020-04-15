export interface Expression {}

export class VoidExpression implements Expression {}

export class FalseExpression implements Expression {}

export class TrueExpression implements Expression {}

export class EqualExpression<TEntity> implements Expression {
    public readonly property: keyof TEntity;
    public readonly value: any;

    public constructor(property: keyof TEntity, value: any) {
        this.property = property;
        this.value = value;
    }
}

export class BetweenExpression<TEntity> implements Expression {
    public readonly property: keyof TEntity;
    public readonly from: any;
    public readonly to: any;

    public constructor(property: keyof TEntity, from: any, to: any) {
        this.property = property;
        this.from = from;
        this.to = to;
    }
}

export class GreaterThanEqualExpression<TEntity> implements Expression {
    public readonly property: keyof TEntity;
    public readonly from: any;

    public constructor(property: keyof TEntity, from: any) {
        this.property = property;
        this.from = from;
    }
}

export class LessThanEqualExpression<TEntity> implements Expression {
    public readonly property: keyof TEntity;
    public readonly to: any;

    public constructor(property: keyof TEntity, to: any) {
        this.property = property;
        this.to = to;
    }
}

export class LikeExpression<TEntity> implements Expression {
    public readonly property: keyof TEntity;
    public readonly value: any;

    public constructor(property: keyof TEntity, value: any) {
        this.property = property;
        this.value = value;
    }
}

export class ContainsExpression<TEntity> implements Expression {
    public readonly property: keyof TEntity;
    public readonly value: any;

    public constructor(property: keyof TEntity, value: any) {
        this.property = property;
        this.value = value;
    }
}

export class AndExpression implements Expression {
    public readonly expressions: Expression[];

    private constructor(expressions: Expression[]) {
        this.expressions = expressions;
    }

    public static make(expressions: Expression[]): Expression {
        const flattened: Expression[] = [];

        for (const exp of expressions) {
            if (exp instanceof VoidExpression) {
                continue;
            }
            if (exp instanceof AndExpression) {
                exp.expressions.forEach((e) => flattened.push(e));
            }
            flattened.push(exp);
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

export class OrExpression implements Expression {
    public readonly expressions: Expression[];

    private constructor(expressions: Expression[]) {
        this.expressions = expressions;
    }

    public static make(expressions: Expression[]): Expression {
        const flattened: Expression[] = [];

        for (const exp of expressions) {
            if (exp instanceof VoidExpression) {
                continue;
            }
            if (exp instanceof OrExpression) {
                exp.expressions.forEach((e) => flattened.push(e));
            }
            flattened.push(exp);
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
