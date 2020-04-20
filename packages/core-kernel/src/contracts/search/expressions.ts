export type VoidExpression = {
    type: "void";
};

export type TrueExpression = {
    type: "true";
};

export type FalseExpression = {
    type: "false";
};

export type EqualExpression<TEntity> = {
    property: keyof TEntity;
    type: "equal";
    value: any;
};

export type BetweenExpression<TEntity> = {
    property: keyof TEntity;
    type: "between";
    from: any;
    to: any;
};

export type GreaterThanEqualExpression<TEntity> = {
    property: keyof TEntity;
    type: "greaterThanEqual";
    from: any;
};

export type LessThanEqualExpression<TEntity> = {
    property: keyof TEntity;
    type: "lessThanEqual";
    to: any;
};

export type LikeExpression<TEntity> = {
    property: keyof TEntity;
    type: "like";
    value: any;
};

export type ContainsExpression<TEntity> = {
    property: keyof TEntity;
    type: "contains";
    value: any;
};

export type AndExpression<TEntity> = {
    type: "and";
    expressions: Expression<TEntity>[];
};

export type OrExpression<TEntity> = {
    type: "or";
    expressions: Expression<TEntity>[];
};

export type Expression<TEntity> =
    | VoidExpression
    | TrueExpression
    | FalseExpression
    | EqualExpression<TEntity>
    | BetweenExpression<TEntity>
    | GreaterThanEqualExpression<TEntity>
    | LessThanEqualExpression<TEntity>
    | LikeExpression<TEntity>
    | ContainsExpression<TEntity>
    | AndExpression<TEntity>
    | OrExpression<TEntity>;
