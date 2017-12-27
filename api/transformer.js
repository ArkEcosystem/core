class Transformer {
  constructor(req, model, name) {
    const version = {
      '1.0.0': 'v1',
      '2.0.0': 'v2',
    }[req.version()]

    let instance = require(`${__root}/api/public/${version}/transformers/${name}`)

    return new instance(model)
  }
}

module.exports = Transformer
