class IpFormat {
  constructor(ajv) {
    ajv.addFormat('ip', {
      type: 'string',
      validate: (value) => {
        return require('ip').isV4Format(str)
      }
    });
  }
}

module.exports = IpFormat
