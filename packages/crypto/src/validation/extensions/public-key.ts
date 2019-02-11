export const publicKey = joi => ({
    name: "publicKey",
    base: joi
        .string()
        .hex()
        .length(66),
});
