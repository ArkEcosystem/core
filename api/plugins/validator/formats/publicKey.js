class PublicKeyFormat {
  constructor (ajv) {
    ajv.addFormat('publicKey', {
      type: 'string',
      validate: (value) => {
        if (value.length === 0) {
          return true
        }

        try {
          return Buffer.from(value, 'hex').length === 33
        } catch (e) {
          return false
        }
      }
    });
  }
}

module.exports = PublicKeyFormat
