export default joi => ({
  name: "arkPublicKey",
  base: joi
    .string()
    .hex()
    .length(66)
});
