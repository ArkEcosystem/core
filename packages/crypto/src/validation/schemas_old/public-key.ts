export const publicKey = joi => ({
    name: "publicKey",
    base: joi
        .string()
        .insensitive()
        .lowercase()
        .hex()
        .length(66),
});
