module.exports = (mock, host) => {
  mock.onGet(`${host}/api/transactions`).reply(200, { data: [] })
  mock.onPost(`${host}/api/transactions`).reply(200, { data: [] })
  mock.onGet(`${host}/api/transactions/123`).reply(200, { data: [] })
  mock.onGet(`${host}/api/transactions/unconfirmed`).reply(200, { data: [] })
  mock.onGet(`${host}/api/transactions/unconfirmed/123`).reply(200, { data: [] })
  mock.onPost(`${host}/api/transactions/search`).reply(200, { data: [] })
  mock.onGet(`${host}/api/transactions/types`).reply(200, { data: [] })
}
