module.exports = (value, singleQuotes = false) => {
  if (value === '*') {
    return value
  }

  if (typeof value === 'number' || singleQuotes) {
    return `'${value}'`
  }

  return `"${value}"`
}
