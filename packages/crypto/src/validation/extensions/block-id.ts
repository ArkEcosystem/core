export const blockId = joi => ({
    name: "blockId",
    base: joi.string().regex(/^[0-9]+$/, "numbers"),
});
