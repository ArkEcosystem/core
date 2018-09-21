module.exports = (mock, host) => {
  mock.onGet(`${host}/api/wallets`).reply(200, { data: [] })
  mock.onGet(`${host}/api/wallets/top`).reply(200, { data: [] })
  mock.onGet(`${host}/api/wallets/123`).reply(200, { data: [] })
  mock.onGet(`${host}/api/wallets/123/transactions`).reply(200, { data: [] })
  mock.onGet(`${host}/api/wallets/123/transactions/sent`).reply(200, { data: [] })
  mock.onGet(`${host}/api/wallets/123/transactions/received`).reply(200, { data: [] })
  mock.onGet(`${host}/api/wallets/123/votes`).reply(200, { data: [] })
  mock.onPost(`${host}/api/wallets/search`).reply(200, { data: [] })
}
