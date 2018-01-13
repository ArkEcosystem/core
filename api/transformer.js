class Transformer {
  constructor (req) {
    this.version = {
      '1.0.0': 'v1',
      '2.0.0': 'v2'
    }[req.version()]
  }

  resource (model, transformer) {
    return this.transform(model, transformer)
  }

  collection (models, transformer) {
    return models.map((model) => this.resource(model, transformer));
  }

  transform (model, transformer) {
    let Instance = requireFrom(`api/public/${this.version}/transformers/${transformer}`)

    return new Instance(model)
  }
}

module.exports = Transformer
