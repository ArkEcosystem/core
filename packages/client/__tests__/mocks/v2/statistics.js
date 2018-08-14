module.exports = (mock, host) => {
  mock.onGet(`${host}/api/statistics/blockchain`).reply(200, { data: [] })
  mock.onGet(`${host}/api/statistics/transactions`).reply(200, { data: [] })
  mock.onGet(`${host}/api/statistics/blocks`).reply(200, { data: [] })
  mock.onGet(`${host}/api/statistics/votes`).reply(200, { data: [] })
  mock.onGet(`${host}/api/statistics/unvotes`).reply(200, { data: [] })
}
