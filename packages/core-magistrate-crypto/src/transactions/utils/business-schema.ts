export const businessSchema = {
    name: {
        $ref: "genericName",
    },
    website: {
        type: "string",
        minLength: 4,
        maxLength: 50,
    },
    vat: {
        type: "string",
        minLength: 8,
        maxLength: 15,
        $ref: "alphanumeric",
    },
    repository: {
        type: "string",
        minLength: 11,
        maxLength: 50,
    },
};
