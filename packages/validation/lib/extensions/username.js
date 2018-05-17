module.exports = (joi) => ({
  name: 'arkUsername',
  base: joi.string().regex(/^[a-z0-9!@$&_.]+$/)
})
