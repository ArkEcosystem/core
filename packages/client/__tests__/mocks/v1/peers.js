module.exports = (mock, host) => {
  mock.onGet(`${host}/api/peers`).reply(200, { data: [] })
  mock.onGet(`${host}/api/peers/get`).reply(200, { data: [] })
  mock.onGet(`${host}/api/peers/version`).reply(200, { data: [] })
}
