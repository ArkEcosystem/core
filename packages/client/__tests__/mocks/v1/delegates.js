module.exports = (mock) => {
  mock.onGet('delegates').reply(200, { data: [] })
  mock.onGet('delegates/count').reply(200, { data: [] })
  mock.onGet('delegates/fee').reply(200, { data: [] })
  mock.onGet('delegates/forging/getForgedByAccount').reply(200, { data: [] })
  mock.onGet('delegates/get').reply(200, { data: [] })
  mock.onGet('delegates/search').reply(200, { data: [] })
  mock.onGet('delegates/voters').reply(200, { data: [] })
}
