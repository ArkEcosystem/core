module.exports = (mock, host) => {
  mock.onGet(`${host}/api/transactions`).reply(200, { data: [] })
  mock.onGet(`${host}/api/transactions/get`).reply(200, { data: [] })
  mock.onGet(`${host}/api/transactions/unconfirmed`).reply(200, { data: [] })
  mock.onGet(`${host}/api/transactions/unconfirmed/get`).reply(200, { data: [] })
}
