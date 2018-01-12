class HexFormat {
  constructor (ajv) {
    ajv.addFormat('hex', {
      type: 'string',
      validate: (value) => {
        try {
          Buffer.from(value, 'hex')
        } catch (e) {
          return false
        }

        return true
      }
    });
  }
}

module.exports = HexFormat
