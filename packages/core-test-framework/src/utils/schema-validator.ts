export const defaultSchemaValidator = {
    extendTransaction: () => {},
    validate: (_, data) => ({
        error: undefined,
        value: data,
    }),
};
