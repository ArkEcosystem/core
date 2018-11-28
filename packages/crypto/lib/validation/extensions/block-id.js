module.exports = joi => ({
  name: 'arkBlockId',
  base: joi.string().regex(/^[0-9]+$/, 'numbers'),
})
