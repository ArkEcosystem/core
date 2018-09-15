const bigi = require('bigi')

module.exports = (joi) => ({
  name: 'bignumber',
  base: joi.object().type(bigi)
})
