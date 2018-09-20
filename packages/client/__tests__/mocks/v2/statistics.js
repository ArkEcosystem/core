module.exports = (mock, host) => {
  mock.onGet(`${host}/api/v2/statistics/blockchain`).reply(200, { data: [] })
  mock.onGet(`${host}/api/v2/statistics/transactions`).reply(200, { data: [] })
  mock.onGet(`${host}/api/v2/statistics/blocks`).reply(200, { data: [] })
  mock.onGet(`${host}/api/v2/statistics/votes`).reply(200, { data: [] })
  mock.onGet(`${host}/api/v2/statistics/unvotes`).reply(200, { data: [] })
}
