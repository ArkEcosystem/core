class CsvFormat {
  constructor (ajv) {
    ajv.addFormat('csv', {
      type: 'string',
      validate: (value) => {
        try {
          var a = value.split(',')
          if (a.length > 0 && a.length <= 1000) {
            return true
          } else {
            return false
          }
        } catch (e) {
          return false
        }
      }
    });
  }
}

module.exports = CsvFormat
