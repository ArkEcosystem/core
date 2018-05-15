module.exports = (joi) => ({
  name: 'arkUsername',
  base: joi.string().alphanum()
})
