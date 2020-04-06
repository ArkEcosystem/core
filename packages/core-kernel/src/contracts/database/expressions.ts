export type VoidExpression = {
    type: "void";
};

export type EqualExpression<TModel, TProperty extends keyof TModel> = {
    type: "equal";
    model: new () => TModel;
    property: TProperty;
    value: any;
};

export type BetweenExpression<TModel, TProperty extends keyof TModel> = {
    type: "between";
    model: new () => TModel;
    property: TProperty;
    from: any;
    to: any;
};

export type GreaterThanEqualExpression<TModel, TProperty extends keyof TModel> = {
    type: "greaterThanEqual";
    model: new () => TModel;
    property: TProperty;
    value: any;
};

export type LessThanEqualExpression<TModel, TProperty extends keyof TModel> = {
    type: "lessThanEqual";
    model: new () => TModel;
    property: TProperty;
    value: any;
};

export type LikeExpression<TModel, TProperty extends keyof TModel> = {
    type: "like";
    model: new () => TModel;
    property: TProperty;
    value: string;
};

export type ContainsExpression<TModel, TProperty extends keyof TModel> = {
    type: "contains";
    model: new () => TModel;
    property: TProperty;
    value: Record<string, any>;
};

export type ModelPropertyExpression<TModel, TProperty extends keyof TModel> =
    | EqualExpression<TModel, TProperty>
    | BetweenExpression<TModel, TProperty>
    | GreaterThanEqualExpression<TModel, TProperty>
    | LessThanEqualExpression<TModel, TProperty>
    | LikeExpression<TModel, TProperty>
    | ContainsExpression<TModel, TProperty>;

export type AndExpression<TModel> = {
    type: "and";
    expressions: (VoidExpression | ModelPropertyExpression<TModel, keyof TModel> | OrExpression<TModel>)[];
};

export type OrExpression<TModel> = {
    type: "or";
    expressions: (VoidExpression | ModelPropertyExpression<TModel, keyof TModel> | AndExpression<TModel>)[];
};

export type Expression<TModel> =
    | VoidExpression
    | ModelPropertyExpression<TModel, keyof TModel>
    | AndExpression<TModel>
    | OrExpression<TModel>;

export const voidExpression = (): VoidExpression => {
    return { type: "void" };
};

export const equalExpression = <TModel, TProperty extends keyof TModel>(
    model: new () => TModel,
    property: TProperty,
    value: any,
): EqualExpression<TModel, TProperty> => {
    return { type: "equal", model, property, value };
};

export const betweenExpression = <TModel, TProperty extends keyof TModel>(
    model: new () => TModel,
    property: TProperty,
    from: any,
    to: any,
): BetweenExpression<TModel, TProperty> => {
    return { type: "between", model, property, from, to };
};

export const greaterThanEqualExpression = <TModel, TProperty extends keyof TModel>(
    model: new () => TModel,
    property: TProperty,
    value: any,
): GreaterThanEqualExpression<TModel, TProperty> => {
    return { type: "greaterThanEqual", model, property, value };
};

export const lessThanEqualExpression = <TModel, TProperty extends keyof TModel>(
    model: new () => TModel,
    property: TProperty,
    value: any,
): LessThanEqualExpression<TModel, TProperty> => {
    return { type: "lessThanEqual", model, property, value };
};

export const likeExpression = <TModel, TProperty extends keyof TModel>(
    model: new () => TModel,
    property: TProperty,
    value: string,
): LikeExpression<TModel, TProperty> => {
    return { type: "like", model, property, value };
};

export const containsExpression = <TModel, TProperty extends keyof TModel>(
    model: new () => TModel,
    property: TProperty,
    value: Record<string, any>,
): ContainsExpression<TModel, TProperty> => {
    return { type: "contains", model, property, value };
};

export const andExpression = <TModel>(expressions: Expression<TModel>[]): Expression<TModel> => {
    const flattened = expressions.reduce((acc, exp) => {
        if (exp.type === "void") {
            return acc;
        }
        if (exp.type === "and") {
            return [...acc, ...exp.expressions];
        }

        return [...acc, exp];
    }, [] as AndExpression<TModel>["expressions"]);

    if (flattened.length === 0) {
        return { type: "void" };
    }
    if (flattened.length === 1) {
        return flattened[0];
    }

    return { type: "and", expressions: flattened };
};

export const orExpression = <TModel>(expressions: Expression<TModel>[]): Expression<TModel> => {
    const flattened = expressions.reduce((acc, exp) => {
        if (exp.type === "void") {
            return acc;
        }
        if (exp.type === "or") {
            return [...acc, ...exp.expressions];
        }

        return [...acc, exp];
    }, [] as OrExpression<TModel>["expressions"]);

    if (flattened.length === 0) {
        return { type: "void" };
    }
    if (flattened.length === 1) {
        return flattened[0];
    }

    return { type: "or", expressions: flattened };
};
