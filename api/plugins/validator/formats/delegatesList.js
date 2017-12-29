class DelegatesListFormat {
  constructor(ajv) {
    ajv.addFormat('delegatesList', {
      type: 'string',
      validate: (value) => {
        obj.limit = 51
        return true
      }
    });
  }
}

module.exports = DelegatesListFormat
