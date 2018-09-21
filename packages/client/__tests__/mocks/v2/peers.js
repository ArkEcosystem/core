module.exports = (mock, host) => {
  mock.onGet(`${host}/api/peers`).reply(200, { data: [] })
  mock.onGet(`${host}/api/peers/123`).reply(200, { data: [] })
}
