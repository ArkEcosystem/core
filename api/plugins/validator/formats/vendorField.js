class VendorFieldFormat {
  constructor(ajv) {
    ajv.addFormat('vendorField', {
      type: 'string',
      validate: (value) => {
        if (value.length === 0) {
          return true
        }

        try {
          return Buffer(value).length < 65
        } catch (e) {
          return false
        }
      }
    });
  }
}

module.exports = VendorFieldFormat
