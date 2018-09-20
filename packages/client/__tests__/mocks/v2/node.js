module.exports = (mock, host) => {
  mock.onGet(`${host}/api/v2/node/status`).reply(200, { data: [] })
  mock.onGet(`${host}/api/v2/node/syncing`).reply(200, { data: [] })
  mock.onGet(`${host}/api/v2/node/configuration`).reply(200, { data: [] })
}
