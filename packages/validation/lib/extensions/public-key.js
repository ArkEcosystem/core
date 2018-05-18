module.exports = (joi) => ({
  name: 'arkPublicKey',
  base: joi.string().alphanum().length(66)
})
