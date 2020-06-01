export type TrueExpression = {
    op: "true";
};

export type FalseExpression = {
    op: "false";
};

export type EqualExpression<TEntity> = {
    property: keyof TEntity;
    op: "equal";
    value: any;
};

export type BetweenExpression<TEntity> = {
    property: keyof TEntity;
    op: "between";
    from: any;
    to: any;
};

export type GreaterThanEqualExpression<TEntity> = {
    property: keyof TEntity;
    op: "greaterThanEqual";
    value: any;
};

export type LessThanEqualExpression<TEntity> = {
    property: keyof TEntity;
    op: "lessThanEqual";
    value: any;
};

export type LikeExpression<TEntity> = {
    property: keyof TEntity;
    op: "like";
    pattern: any;
};

export type ContainsExpression<TEntity> = {
    property: keyof TEntity;
    op: "contains";
    value: any;
};

export type AndExpression<TEntity> = {
    op: "and";
    expressions: Expression<TEntity>[];
};

export type OrExpression<TEntity> = {
    op: "or";
    expressions: Expression<TEntity>[];
};

export type Expression<TEntity> =
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
