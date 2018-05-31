module.exports = (value, singleQuotes = false) => {
  if (typeof value === 'number' || singleQuotes) {
    return `'${value}'`
  }

  return `"${value}"`
}
