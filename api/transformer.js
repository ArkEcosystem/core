const path = require('path')
const State = require('./plugins/state')

module.exports = class Transformer {
  resource (model, transformer) {
    return this.transform(model, transformer)
  }

  collection (models, transformer) {
    return models.map((model) => this.resource(model, transformer));
  }

  transform (model, transformer) {
    const version = { '1.0.0': 'v1', '2.0.0': 'v2' }[State.getRequest().version()]

    return require(path.resolve(__dirname, `public/${version}/transformers/${transformer}`))(model)
  }
}
