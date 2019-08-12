export const businessProperties = {
    name: {
        type: "string",
        minLength: 1,
        maxLength: 40,
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
    },
    github: {
        type: "string",
        minLength: 11,
        maxLength: 50,
    },
};
