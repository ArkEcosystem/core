class SignatureFormat {
  constructor (ajv) {
    ajv.addFormat('signature', {
      type: 'string',
      validate: (value) => {
        if (value.length === 0) {
          return true
        }

        try {
          return Buffer(value, 'hex').length < 73
        } catch (e) {
          return false
        }
      }
    });
  }
}

module.exports = SignatureFormat
