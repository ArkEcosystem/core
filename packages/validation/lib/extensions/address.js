module.exports = (joi) => ({
  name: 'phantomAddress',
  base: joi.string().alphanum().length(34)
})
