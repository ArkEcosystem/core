module.exports = (joi) => ({
  name: 'arkUsername',
  base: joi.string().regex(/^[a-z0-9!@$&_.]+$/).min(1).max(20)
})
