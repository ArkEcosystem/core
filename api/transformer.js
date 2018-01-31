const path = require('path')
const logger = requireFrom('core/logger')

module.exports = class Transformer {
  constructor(req) {
    this.req = req
  }

  resource (model, transformer) {
    return this.transform(model, transformer)
  }

  collection (models, transformer) {
    return models.map((model) => this.resource(model, transformer));
  }

  transform (model, transformer) {
    const version = { '1.0.0': 'v1', '2.0.0': 'v2' }[this.req.version()]

    return require(path.resolve(__dirname, `public/${version}/transformers/${transformer}`))(model)
  }
}
