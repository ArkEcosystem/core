module.exports = joi => ({
  name: 'phantomBlockId',
  base: joi.string().regex(/^[0-9]+$/, 'numbers'),
})
