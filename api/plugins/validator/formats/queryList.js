class QueryListFormat {
  constructor(ajv) {
    ajv.addFormat('queryList', {
      type: 'string',
      validate: (value) => {
        obj.limit = 100
        return true
      }
    });
  }
}

module.exports = QueryListFormat
