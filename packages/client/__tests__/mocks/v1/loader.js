module.exports = (mock) => {
  mock.onGet('loader/autoconfigure').reply(200, { data: [] })
  mock.onGet('loader/status').reply(200, { data: [] })
  mock.onGet('loader/status/sync').reply(200, { data: [] })
}
