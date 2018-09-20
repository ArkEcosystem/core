module.exports = (mock, host) => {
  mock.onGet(`${host}/api/v2/peers`).reply(200, { data: [] })
  mock.onGet(`${host}/api/v2/peers/123`).reply(200, { data: [] })
}
