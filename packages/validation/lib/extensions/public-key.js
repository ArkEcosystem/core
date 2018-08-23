module.exports = (joi) => ({
  name: 'phantomPublicKey',
  base: joi.string().hex().length(66)
})
