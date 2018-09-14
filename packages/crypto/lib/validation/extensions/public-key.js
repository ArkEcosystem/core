module.exports = (joi) => ({
  name: 'arkPublicKey',
  base: joi.string().hex().length(66)
})
