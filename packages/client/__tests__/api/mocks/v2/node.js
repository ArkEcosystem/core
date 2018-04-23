module.exports = (mock) => {
  mock.onGet('node/status').reply(200, { data: [] })
  mock.onGet('node/syncing').reply(200, { data: [] })
  mock.onGet('node/configuration').reply(200, { data: [] })
}
