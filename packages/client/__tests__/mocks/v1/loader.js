module.exports = (mock, host) => {
  mock.onGet(`${host}/api/loader/autoconfigure`).reply(200, { data: [] })
  mock.onGet(`${host}/api/loader/status`).reply(200, { data: [] })
  mock.onGet(`${host}/api/loader/status/sync`).reply(200, { data: [] })
}
