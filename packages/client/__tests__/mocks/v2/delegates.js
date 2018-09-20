module.exports = (mock, host) => {
  mock.onGet(`${host}/api/v2/delegates`).reply(200, { data: [] })
  mock.onGet(`${host}/api/v2/delegates/123`).reply(200, { data: [] })
  mock.onGet(`${host}/api/v2/delegates/123/blocks`).reply(200, { data: [] })
  mock.onGet(`${host}/api/v2/delegates/123/voters`).reply(200, { data: [] })
}
