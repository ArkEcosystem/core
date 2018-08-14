module.exports = (mock, host) => {
  mock.onGet(`${host}/api/accounts`).reply(200, { data: [] })
  mock.onGet(`${host}/api/accounts/count`).reply(200, { data: [] })
  mock.onGet(`${host}/api/accounts/delegates`).reply(200, { data: [] })
  mock.onGet(`${host}/api/accounts/delegates/fee`).reply(200, { data: [] })
  mock.onGet(`${host}/api/accounts/getAllAccounts`).reply(200, { data: [] })
  mock.onGet(`${host}/api/accounts/getBalance`).reply(200, { data: [] })
  mock.onGet(`${host}/api/accounts/getPublicKey`).reply(200, { data: [] })
  mock.onGet(`${host}/api/accounts/top`).reply(200, { data: [] })
}
