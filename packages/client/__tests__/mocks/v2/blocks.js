module.exports = (mock, host) => {
  mock.onGet(`${host}/api/blocks`).reply(200, { data: [] })
  mock.onGet(`${host}/api/blocks/123`).reply(200, { data: [] })
  mock.onGet(`${host}/api/blocks/123/transactions`).reply(200, { data: [] })
  mock.onPost(`${host}/api/blocks/search`).reply(200, { data: [] })
}
