const transformResource = require('./transform-resource')

module.exports = (request, data, transformer) => {
  const tasks = []
  data = data || []

  data.forEach((d) => tasks.push(transformResource(request, d, transformer)))

  return Promise.all(tasks).then(task => data.map((d, index) => task[index]))
}
