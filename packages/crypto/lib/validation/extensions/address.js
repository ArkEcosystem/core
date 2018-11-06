module.exports = (joi) => ({
  name: 'arkAddress',
  base: joi.string().alphanum().length(34)
})
