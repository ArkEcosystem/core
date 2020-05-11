// TODO: use the previous validator instead here
export const defaultSchemaValidator = {
    extendTransaction: () => {},
    validate: (_, data) => ({
        error: undefined,
        value: data,
    }),
};
