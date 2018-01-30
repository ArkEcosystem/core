module.exports = (value) => {
  try {
    return JSON.parse(value)
  } catch (e) {
    return false
  }
}
