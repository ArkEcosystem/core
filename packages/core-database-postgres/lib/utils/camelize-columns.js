module.exports = (pgp, data) => {
  const tmp = data[0]

  for (const prop in tmp) {
    const camel = pgp.utils.camelize(prop)

    if (!(camel in tmp)) {
      for (let i = 0; i < data.length; i++) {
        const d = data[i]
        d[camel] = d[prop]
        delete d[prop]
      }
    }
  }
}
