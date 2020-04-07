export class VoidExpression {}

export class FalseExpression {}

export class TrueExpression {}

export class EqualExpression<TModel> {
    public readonly property: keyof TModel;
    public readonly value: any;

    public constructor(property: keyof TModel, value: any) {
        this.property = property;
        this.value = value;
    }
}

export class BetweenExpression<TModel> {
    public readonly property: keyof TModel;
    public readonly from: any;
    public readonly to: any;

    public constructor(property: keyof TModel, from: any, to: any) {
        this.property = property;
        this.from = from;
        this.to = to;
    }
}

export class GreaterThanEqualExpression<TModel> {
    public readonly property: keyof TModel;
    public readonly from: any;

    public constructor(property: keyof TModel, from: any) {
        this.property = property;
        this.from = from;
    }
}

export class LessThanEqualExpression<TModel> {
    public readonly property: keyof TModel;
    public readonly to: any;

    public constructor(property: keyof TModel, to: any) {
        this.property = property;
        this.to = to;
    }
}

export class LikeExpression<TModel> {
    public readonly property: keyof TModel;
    public readonly value: any;

    public constructor(property: keyof TModel, value: any) {
        this.property = property;
        this.value = value;
    }
}

export class ContainsExpression<TModel> {
    public readonly property: keyof TModel;
    public readonly value: any;

    public constructor(property: keyof TModel, value: any) {
        this.property = property;
        this.value = value;
    }
}

export class AndExpression<TModel> {
    public readonly expressions: Expression<TModel>[];

    private constructor(expressions: Expression<TModel>[]) {
        this.expressions = expressions;
    }

    public static make<TModel>(expressions: Expression<TModel>[]): Expression<TModel> {
        const flattened = expressions.reduce((acc: Expression<TModel>[], exp) => {
            if (exp instanceof VoidExpression) {
                return acc;
            }
            if (exp instanceof AndExpression) {
                return [...acc, ...exp.expressions];
            }

            return [...acc, exp];
        }, []);

        if (flattened.length === 0) {
            return new VoidExpression();
        }
        if (flattened.length === 1) {
            return flattened[0];
        }
        if (flattened.find(e => e instanceof FalseExpression)) {
            return new FalseExpression();
        }

        return new AndExpression(flattened);
    }
}

export class OrExpression<TModel> {
    public readonly expressions: Expression<TModel>[];

    private constructor(expressions: Expression<TModel>[]) {
        this.expressions = expressions;
    }

    public static make<TModel>(expressions: Expression<TModel>[]): Expression<TModel> {
        const flattened = expressions.reduce((acc: Expression<TModel>[], exp) => {
            if (exp instanceof VoidExpression) {
                return acc;
            }
            if (exp instanceof OrExpression) {
                return [...acc, ...exp.expressions];
            }

            return [...acc, exp];
        }, []);

        if (flattened.length === 0) {
            return new VoidExpression();
        }
        if (flattened.length === 1) {
            return flattened[0];
        }
        if (flattened.find(e => e instanceof TrueExpression)) {
            return new TrueExpression();
        }

        return new OrExpression(flattened);
    }
}

export type Expression<TModel> =
    | VoidExpression
    | FalseExpression
    | TrueExpression
    | EqualExpression<TModel>
    | BetweenExpression<TModel>
    | GreaterThanEqualExpression<TModel>
    | LessThanEqualExpression<TModel>
    | LikeExpression<TModel>
    | ContainsExpression<TModel>
    | AndExpression<TModel>
    | OrExpression<TModel>;
