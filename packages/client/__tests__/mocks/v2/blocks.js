module.exports = (mock, host) => {
  mock.onGet(`${host}/api/v2/blocks`).reply(200, { data: [] })
  mock.onGet(`${host}/api/v2/blocks/123`).reply(200, { data: [] })
  mock.onGet(`${host}/api/v2/blocks/123/transactions`).reply(200, { data: [] })
  mock.onPost(`${host}/api/v2/blocks/search`).reply(200, { data: [] })
}
