export const address = joi => ({
    name: "address",
    base: joi
        .string()
        .alphanum()
        .length(34),
});
