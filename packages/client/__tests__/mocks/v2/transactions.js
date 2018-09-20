module.exports = (mock, host) => {
  mock.onGet(`${host}/api/v2/transactions`).reply(200, { data: [] })
  mock.onPost(`${host}/api/v2/transactions`).reply(200, { data: [] })
  mock.onGet(`${host}/api/v2/transactions/123`).reply(200, { data: [] })
  mock.onGet(`${host}/api/v2/transactions/unconfirmed`).reply(200, { data: [] })
  mock.onGet(`${host}/api/v2/transactions/unconfirmed/123`).reply(200, { data: [] })
  mock.onPost(`${host}/api/v2/transactions/search`).reply(200, { data: [] })
  mock.onGet(`${host}/api/v2/transactions/types`).reply(200, { data: [] })
}
